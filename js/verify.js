// verify.js: Running the player's code and verifying AI-written bugs
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- running the player's code in a Web Worker with a timeout; the server's CSP blocks all network access ----------
// JavaScript gets a fresh runner.js worker per run. Python (Pyodide, ~10 MB, loaded once) and Lua (Fengari) keep one warm worker
// each; a run that never ends terminates that worker, and a new one is started for the next run.
const LANGS={js:{name:"JavaScript",ext:"js",color:"#f0d43a",ink:"#2a2306",print:/console\s*\.\s*log/},
 py:{name:"Python",ext:"py",color:"#4f8fd6",ink:"#ffffff",print:/\bprint\s*\(/},
 lua:{name:"Lua",ext:"lua",color:"#7b6be6",ink:"#ffffff",print:/\bprint\s*\(/}};
const WARM={py:{file:"runner-py.js",w:null,ready:null,queue:Promise.resolve()},lua:{file:"runner-lua.js",w:null,ready:null,queue:Promise.resolve()}};
function warmUp(lang){
  // start (or reuse) the language's worker; resolves once its runtime has loaded
  const k=WARM[lang];
  if(!k)return Promise.resolve({ready:true});
  if(!k.w){
    try{
      k.w=new Worker(k.file)
    }catch(e){
      k.w=null;
      return Promise.resolve({ready:false,err:"cannot start "+LANGS[lang].name+" here: "+e})
    }
    const w=k.w;
    k.ready=new Promise(res=>{
      w.onmessage=e=>{
        if(e.data&&"ready" in e.data)res(e.data)
      };
      w.onerror=e=>{
        e.preventDefault&&e.preventDefault();
        res({ready:false,err:LANGS[lang].name+" could not load ("+(e.message||"network error")+")"})
      }
    });
    k.ready.then(r=>{
      if(!r.ready&&k.w===w)k.w=null   // try again next time
    })
  }
  return k.ready
}
function runWarm(lang,src,ms,onStatus){
  const k=WARM[lang];
  const job=k.queue.then(async()=>{
    let loaded=false;
    const slow=setTimeout(()=>{
      if(!loaded&&onStatus)onStatus("Loading "+LANGS[lang].name+"… (only the first time)")
    },150);
    const r=await warmUp(lang);
    loaded=true;
    clearTimeout(slow);
    if(!r.ready)return {ok:false,err:r.err||LANGS[lang].name+" could not load",out:[],load:true};
    const w=k.w;
    return new Promise(res=>{
      const timer=setTimeout(()=>{
        try{
          w.terminate()
        }catch(e){
        }
        if(k.w===w)k.w=null;
        res({ok:false,err:"it ran for too long (an endless loop?)",timeout:true,out:[]})
      },ms);
      w.onmessage=e=>{
        if(e.data&&"ready" in e.data)return;
        clearTimeout(timer);
        res(e.data)
      };
      w.onerror=e=>{
        e.preventDefault&&e.preventDefault();
        clearTimeout(timer);
        if(k.w===w)k.w=null;
        res({ok:false,err:String(e.message||"error"),out:[]})
      };
      w.postMessage({src:String(src)})
    })
  });
  k.queue=job.catch(()=>{
  });
  return job
}
function runCode(src,ms=900,lang="js",onStatus){
  if(lang==="py"||lang==="lua")return runWarm(lang,src,ms+300,onStatus);
  return new Promise(res=>{
    let w;
    const done=r=>{
      try{
        w&&w.terminate()
      }catch(e){
      }
      res(r)
    };
    try{
      w=new Worker("runner.js");
      const timer=setTimeout(()=>done({ok:false,err:"it ran for too long (an endless loop?)",timeout:true,out:[]}),ms);
      w.onmessage=e=>{
        clearTimeout(timer);
        done(e.data)
      };
      w.onerror=e=>{
        clearTimeout(timer);
        done({ok:false,err:String(e.message||"error"),out:[]})
      };
      w.postMessage({src:String(src)});
    }catch(e){
      done({ok:false,err:"cannot run code here: "+e,out:[]})
    }
  })
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// ---------- AI-written bugs (Claude or an open model): fetched from the local server, then VERIFIED by running them before they are ever shown ----------
let AI_ON=false,AI_BY="AI",aiFails=0;
const AIQ=[];
let aiBusy=false;
// ?ai=0 keeps a session on the hand-checked bank (the integration tests use it, so test runs never spend the model's quota)
if(QS.get("ai")!=="0")fetch("/api/status").then(r=>r.json()).then(j=>{
  AI_ON=!!j.ai;
  AI_BY=String(j.by||"AI").slice(0,40);
  prefetchAI()
}).catch(()=>{
});
async function verifyBug(raw){
  try{
    const lines=String(raw.code).split("\n"),bl=raw.bug_line|0;
    if(bl<1||bl>lines.length||!CATS.includes(raw.category)||!Array.isArray(raw.out)||!raw.out.length||!Array.isArray(raw.hints)||raw.hints.length<3||typeof raw.fix!=="string")return null;
    const fixed=lines.slice();
    fixed[bl-1]=lines[bl-1].match(/^\s*/)[0]+raw.fix.trim();
    const extra=String(raw.extra||"").split("\n").filter(l=>l.trim());
    if(extra.length>3||!extra.every(l=>/^\s*console\s*\.\s*log\(.*\);?\s*$/.test(l)))return null;   // hidden tests may only print
    const ex=extra.length?"\n"+extra.join("\n"):"";
    const out=raw.out.map(String),f=await runCode(fixed.join("\n")+ex),b=await runCode(lines.join("\n")+ex);
    if(!f.ok||!same(f.out,out))return null;                 // the fix must really produce the claimed output
    if(b.ok&&same(b.out,out))return null;                   // and the buggy version must really behave differently
    return {title:String(raw.title||"Mystery bug"),task:String(raw.task),category:raw.category,expected:String(raw.expected),actual:String(raw.actual),code:lines.join("\n"),bug_line:bl,
   hints:raw.hints.slice(0,3).map(String),fix:raw.fix.trim(),explanation:String(raw.explanation||""),out,extra:extra.join("\n"),ok:[raw.category],src:"ai",by:AI_BY,lang:"js"}
  }catch(e){
    return null
  }
}
async function prefetchAI(){
  if(!AI_ON||aiBusy||AIQ.length>=2||aiFails>=4)return;
  aiBusy=true;
  try{
    const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),30000);
    const r=await fetch("/api/bug",{method:"POST",body:JSON.stringify({difficulty:S.catches<4?"easy":"medium"}),signal:ctl.signal});
    clearTimeout(to);
    const j=await r.json(),b=j.ok?await verifyBug(j.bug):null;
    if(b){
      AIQ.push(b);
      aiFails=0
    }else aiFails++
  }
  catch(e){
    aiFails++
  }
  aiBusy=false;
  if(AIQ.length<2&&aiFails<4)setTimeout(prefetchAI,1200)
}
