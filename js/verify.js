// verify.js: Running the player's code and verifying Claude-written bugs
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- running the player's code: runner.js in a Web Worker with a timeout; the server's CSP blocks all network access ----------
function runCode(src,ms=900){
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
// ---------- Claude-written bugs: fetched from the local server, then VERIFIED by running them before they are ever shown ----------
let AI_ON=false,aiFails=0;
const AIQ=[];
let aiBusy=false;
fetch("/api/status").then(r=>r.json()).then(j=>{
  AI_ON=!!j.ai;
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
   hints:raw.hints.slice(0,3).map(String),fix:raw.fix.trim(),explanation:String(raw.explanation||""),out,extra:extra.join("\n"),ok:[raw.category],src:"ai"}
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
