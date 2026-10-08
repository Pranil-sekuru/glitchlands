// battle.js: Battle: pick the line, name the mistake, fix and run, net throw, result
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- battle ----------
let B=null,bs=null,lastTitle="";
function pickBug(){
  if(!S.tut)return BANK.find(b=>b.title==="Pizza Party Problem");
  const tmax=S.catches<3?1:S.catches<8?2:3;
  const pool=REG===2?BANK.filter(b=>!b.quest&&!b.quest2&&b.title!==lastTitle&&(b.r2||(TIER[b.title]||2)>=2)):BANK.filter(b=>!b.quest&&!b.r2&&b.title!==lastTitle&&(TIER[b.title]||2)<=tmax);
  const w=pool.map(b=>{
    const s=S.stats[b.category]||{hit:0,miss:0};
    return Math.max(1,1+s.miss*1.5-s.hit*0.4)
  });
  let r=Math.random()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<pool.length;i++){
    r-=w[i];
    if(r<=0)return pool[i]
  }
  return pool[0]
}
function dailySet(){
  // 3 different bugs per day, picked by the date: ~1000 combinations from the bank
  let h=0;
  for(const ch of today())h=(h*31+ch.charCodeAt(0))>>>0;
  const rnd=()=>{
    h=(h*1664525+1013904223)>>>0;
    return h/4294967296
  };
  const pool=BANK.filter(b=>!b.quest&&!b.r2&&(TIER[b.title]||2)<=2).slice();
  for(let i=pool.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [pool[i],pool[j]]=[pool[j],pool[i]]
  }
  const out=[],cats=new Set();
  for(const b of pool){
    if(!cats.has(b.category)){
      out.push(b);
      cats.add(b.category)
    }
    if(out.length==3)break
  }
  for(const b of pool){
    if(out.length>=3)break;
    if(!out.includes(b))out.push(b)
  }
  return out
}
function dailyN(){
  return(S.daily&&S.daily.date===today())?S.daily.n:0
}
function startDaily(){
  if(mode!=="walk"||P.moving)return;
  const n=dailyN();
  if(n>=3){
    say(["You cleared all 3 of today's Bugs of the Day. A new set arrives tomorrow!"]);
    return
  }
  startBattle(false,{daily:true,bug:dailySet()[n],idx:n})
}
const art=n=>/^[aeiou]/i.test(n)?"an":"a";
function plog(ev,x){
  try{
    S.log=S.log||[];
    S.log.push(Object.assign({t:Date.now(),sid:S.sid,ev:ev,b:B&&B.title,ph:bs&&bs.phase,lives:bs&&bs.lives},x||{}));
    if(S.log.length>800)S.log.splice(0,S.log.length-800);
    save()
  }catch(e){
  }
}
const esc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;");
function dprv(){
  return Math.min(3,window.devicePixelRatio||1)
}
function fitField(){
  const c=$("fc"),f=$("field");
  if(!f||!f.clientWidth)return;
  const d=dprv();
  c.width=Math.round(f.clientWidth*d);
  c.height=Math.round(f.clientHeight*d);
  c._d=d
}
function hl(l){
  // tiny syntax highlighter so the code reads like an editor
  return esc(l).replace(/(\/\/.*$)|("[^"]*"|'[^']*')|\b(const|let|var|function|return|if|else|for|while|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b|\b([a-zA-Z_]\w*)(?=\()/g,
  (m,cm,st,kw,nu,fn)=>cm?'<span class="c">'+m+'</span>':st?'<span class="s">'+m+'</span>':kw?'<span class="k">'+m+'</span>':nu?'<span class="n">'+m+'</span>':'<span class="f">'+m+'</span>')
}
function show(id,on){
  $(id).style.display=on?"":"none"
}
function renderCode(edit){
  $("code").innerHTML=B.code.split("\n").map((l,i)=>(edit&&i==B.bug_line-1)
  ?`<div class="ln edit" data-n="${i}"><b>${i+1}</b><input id="fxin" value="${esc(l).replace(/"/g,"&quot;")}" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off"></div>`
  :`<div class="ln" data-n="${i}" role="button" tabindex="0"><b>${i+1}</b><pre>${hl(l)||" "}</pre></div>`).join("")
}
function startBattle(rival,opts={}){
  mode="battle";
  flash=300;
  const ai=(!rival&&!opts.daily&&S.tut)?AIQ.shift():null;
  B=opts.bug||(ai||pickBug());
  lastTitle=B.title;
  const vis=makeVis(pick(catList()),rival),tut=!S.tut&&!rival&&!opts.daily,max=tut?99:(opts.lives||(S.catches<3?5:3));   // the look is random: it never reveals the bug's type
  bs={phase:"line",cur:0,lives:max,max,hints:0,hintTxt:"",crossed:new Set(),opts:[],ci:0,rival,won:false,vis,tut,daily:!!opts.daily,didx:opts.idx||0,runs:0,typeTries:0,quest:opts.quest||null,reg:REG,byteAsks:0,fail:null,byteTxt:"",t0:Date.now()};
  if(opts.quest==="compiler")vis.scale=1.25;
  $("battle").classList.add("on");
  fitField();
  $("fname").textContent="mystery_bug.js";
  $("meinfo").textContent="XP "+S.xp+" · 🔥"+S.streak;
  $("xpbar").style.width=Math.min(100,(S.xp%150)/1.5)+"%";
  show("code",true);
  show("picked",false);
  show("menu",false);
  show("result",false);
  show("fxbar",false);
  show("fxout",false);
  show("hintbtn",true);
  $("fn").textContent=rival?"NULLO'S RUSH":opts.quest?opts.label.toUpperCase():(opts.daily?"BUG OF THE DAY "+(opts.idx+1)+"/3":"WILD BUG "+vis.epi.toUpperCase())+(vis.shiny?" ✨":"");
  $("fl").textContent=rival||opts.daily||opts.quest?"":"  Lv."+(tut?1:3);
  $("ft").textContent=(B.src=="ai"?"🤖 written by Claude · verified by running it":"📘 from the bug bank")+" · type unknown";
  $("fhp").style.width="100%";
  renderCode(false);
  $("code").onclick=e=>{
    const l=e.target.closest(".ln");
    if(l&&bs&&bs.phase=="line"){
      bs.cur=+l.dataset.n;
      paintCode();
      pickLine()
    }
  };
  if(tut){
    bs.hints=1;
    bs.hintTxt=B.hints[0]
  }
  plog("start",{src:B.src||"bank",quest:opts.quest||null,rival:!!rival,daily:!!opts.daily,tut});
  paintCode();
  info(rival?"Nullo challenges you! ":opts.quest?"The glitch fights back! ":(opts.daily?"Daily hunt, bug "+(opts.idx+1)+" of 3! ":"A wild Bug appeared! "));
  prefetchAI();
}
function info(pre=""){
  $("hearts").innerHTML=bs.tut?'<span style="font-size:14px;letter-spacing:0">Practice round: unlimited tries</span>':"";
  $("hearts").style.display=bs.tut?"":"none";
  $("goal").innerHTML=`<b>GOAL:</b> ${esc(B.task)}<div class="chips"><span class="e">Expected: <code>${esc(B.expected)}</code></span><span class="g">Got: <code>${esc(B.actual)}</code></span></div>`;
  const ins={line:bs.tut?"STEP 1: Click the line where Got goes wrong.":"Click the BUGGY line.",
  type:"STEP 2: Which label fits best? (Practice only: no heart is lost.) Click one, or press 1-"+bs.opts.length+".",
  fix:"STEP 3: Edit the highlighted line so the program prints what's Expected, then press RUN (Enter)."}[bs.phase]||"";
  $("msg").textContent=pre+ins;
  show("goal",bs.phase!="done");
  $("fhp").style.width=({line:100,type:66,fix:33,fixed:0,done0:0,done:bs.won?0:100})[bs.phase]+"%";
  const h=$("hint"),hh=(bs.hintTxt?"💡 <b>PROF:</b> "+esc(bs.hintTxt):"")+(bs.byteTxt?(bs.hintTxt?"<br>":"")+"🐤 <b>BYTE:</b> "+bs.byteTxt:"");
  if(hh&&bs.phase!="done"){
    h.style.display="";
    h.innerHTML=hh
  }else h.style.display="none";
  $("hintbtn").textContent="💡 HINT ("+(3-bs.hints)+")";
  $("hintbtn").disabled=bs.hints>=3;
}
function paintCode(){
  [...$("code").children].forEach((d,i)=>{
    d.classList.toggle("cur",i==bs.cur&&bs.phase=="line");
    d.classList.toggle("cross",bs.crossed.has(i))
  });
  const c=$("code").children[bs.cur];
  c&&c.scrollIntoView({block:"nearest"})
}
function miss(){
  const s=S.stats[B.category]=S.stats[B.category]||{hit:0,miss:0};
  s.miss++;
  save()
}
function lose(msg){
  // one wrong move costs a heart (practice round: free)
  miss();
  bs.shake=performance.now();
  if(!bs.tut)bs.lives--;
  if(bs.lives<=0){
    finish(false);
    return true
  }
  info(msg);
  return false
}
function pickLine(){
  if(bs.cur==B.bug_line-1){
    plog("line",{ok:true});
    bs.phase="type";
    const pool=catList().filter(c=>!B.ok.some(o=>blurry(o).has(c))),n=Math.min(S.catches<5?2:3,pool.length);
    bs.opts=[B.category,...pool.sort(()=>Math.random()-.5).slice(0,n)].sort(()=>Math.random()-.5);
    bs.ci=0;
    show("code",false);
    show("picked",true);
    show("menu",true);
    bs.atkAt=performance.now();
    $("picked").innerHTML=`<b>Buggy line ${B.bug_line}:</b> <code>${esc(B.code.split("\n")[B.bug_line-1].trim())}</code>`;
    paintMenu();
    info("Right line! ");
  }else{
    plog("line",{ok:false});
    bs.crossed.add(bs.cur);
    paintCode();
    // only the practice round tells you which way to look; real hunts make you think
    if(!lose("Not that line"+(bs.tut?" (practice tip: the bug is "+(bs.cur<B.bug_line-1?"further DOWN":"further UP")+")":"")+". "))paintCode();
  }
}
function paintMenu(){
  $("menu").innerHTML=bs.opts.map((o,i)=>`<div class="opt ${i==bs.ci?"cur":""}" role="button" tabindex="0" aria-pressed="${i==bs.ci}" data-i="${i}" style="--c:${(SPECIES[o]||[0,"#7fd89a"])[1]}"><span class="k">${i+1}</span><b>${o}</b><small>${DESC[o]}</small></div>`).join("")
}
for(const id of ["code","menu"])$(id).addEventListener("keydown",e=>{
  const t=e.target.closest&&e.target.closest(".ln,.opt");
  if(t&&(e.key==="Enter"||e.key===" ")){
    e.preventDefault();
    e.stopPropagation();
    t.click()
  }
});   // lines and options are keyboard-operable
$("menu").onclick=e=>{
  const d=e.target.closest("[data-i]");
  if(d&&bs&&bs.phase=="type"){
    bs.ci=+d.dataset.i;
    pickType()
  }
};
function pickType(){
  const c=bs.opts[bs.ci];
  if(B.ok.includes(c)){
    plog("type",{ok:true,tries:bs.typeTries});
    if(bs.typeTries==0)bs.typeBonus=5;
    return startFix()
  }
  // naming the mistake is practice, not the test (the repair is): a wrong label costs nothing, and every option stays available
  plog("type",{ok:false});
  bs.typeTries++;
  info("Not quite. That label doesn't fit this bug: re-read the descriptions. ")
}
// ---------- STEP 3: actually fix the code, then run it ----------
function startFix(){
  plog("fix-start");
  bs.phase="fix";
  show("picked",false);
  show("menu",false);
  show("code",true);
  show("fxbar",true);
  show("fxout",true);
  $("fxout").innerHTML='<span class="dim">Press RUN to see what your program prints.</span>';
  renderCode(true);
  bs.atkAt=performance.now();
  if(bs.tut&&bs.hints<3){
    bs.hints=3;
    bs.hintTxt=B.hints[2]
  }
  info("Now fix it! ");
  const inp=$("fxin");
  if(inp){
    inp.focus();
    inp.setSelectionRange(inp.value.length,inp.value.length)
  }
}
function resetFix(){
  if(bs&&bs.phase=="fix"){
    const i=$("fxin");
    if(i){
      i.value=B.code.split("\n")[B.bug_line-1];
      i.focus()
    }
  }
}
function giveUp(){
  if(bs&&bs.phase=="fix"){
    plog("giveup",{runs:bs.runs});
    finish(false)
  }
}
let running=false;
const q2=t=>"<code>"+esc(t)+"</code>";
function byteAsk(){
  // Byte reads the last failing run and says, in plain words, which test failed and what that suggests
  if(!bs||bs.phase!=="fix")return;
  bs.byteAsks++;
  plog("byte",{has:!!bs.fail});
  const f=bs.fail;
  if(!f){
    bs.byteTxt="Run your fix first. I can only explain a test once it has failed!";
    info();
    return
  }
  let t;
  if(f.err){
    if(f.timeout||/too much output/i.test(f.err))t="your program never finishes (or prints forever). A loop isn't moving toward its stop condition. Check what changes each time round.";
    else if(/not defined|find variable/i.test(f.err)){
      const m=f.err.match(/variable:\s*(\w+)/i)||f.err.match(/(\w+) is not defined/);
      t="it uses a name the computer doesn't know"+(m?" ("+q2(m[1])+")":"")+". Compare the spelling with the variables in the code above.";
    }
    else if(/syntax|unexpected/i.test(f.err))t="something is missing or extra: a bracket, a quote or an operator. Read your line slowly, symbol by symbol.";
    else t="it crashed with "+q2(f.err)+". Look at the values your line uses.";
  }else{
    const exp=B.out,got=f.out;
    let i=0;
    while(i<exp.length&&got[i]===exp[i])i++;
    const hidden=i>=f.vis&&B.extra,E=exp[i]==null?"(nothing)":exp[i],A=got[i]==null?"(nothing)":got[i];
    if(hidden){
      t="your fix passes the example, but a hidden test fails. The test "+q2(B.extra.split("\n")[Math.min(i-f.vis,B.extra.split("\n").length-1)].trim())+" should print "+q2(E)+" but printed "+q2(A)+". Your change works for one input, not for all of them.";
    }
    else{
      t="the output doesn't match. Line "+(i+1)+" should print "+q2(E)+" but your program printed "+q2(A)+". ";
      if(/undefined/.test(A))t+="'undefined' means a value was never given back or the wrong thing was read.";
      else if(got.length<exp.length)t+="It printed fewer lines than expected, so something stops too early.";
      else if(got.length>exp.length)t+="It printed too many lines, so something runs too long.";
      else if(!isNaN(+E)&&!isNaN(+A))t+="The number is "+(Math.abs(+A-+E))+" "+(+A>+E?"too big":"too small")+". Check the arithmetic on your line.";
      else{
        const ne=String(E).match(/-?\d+(?:\.\d+)?/g),na=String(A).match(/-?\d+(?:\.\d+)?/g);
        if(ne&&na&&ne.length==na.length&&String(E).replace(/-?\d+(?:\.\d+)?/g,"#")===String(A).replace(/-?\d+(?:\.\d+)?/g,"#")){
          const k=ne.findIndex((v,j)=>v!==na[j]);
          t+="The words are right but a number is off: it should be "+ne[k]+" and it is "+na[k]+" ("+(+na[k]>+ne[k]?"too big":"too small")+" by "+Math.abs(+na[k]-+ne[k])+"). Check the arithmetic on your line."
        }
        else t+="Compare them character by character."
      }
    }
  }
  bs.byteTxt=t;
  info()
}
async function runFix(){
  if(!bs||bs.phase!=="fix"||running)return;
  const inp=$("fxin"),orig=B.code.split("\n")[B.bug_line-1],val=(inp.value||"").replace(/\s+$/,"");
  const fo=$("fxout");
  if(!val.trim()||val.trim()===orig.trim()){
    fo.innerHTML='<span class="bad">Change something first. Look at Expected vs Got, then edit the line.</span>';
    return
  }
  if(/console\s*\.\s*log/.test(val)&&!/console\s*\.\s*log/.test(orig)){
    fo.innerHTML='<span class="bad">Fix the logic. Printing the answer yourself doesn\'t count!</span>';
    return
  }
  running=true;
  $("fxrun").disabled=true;
  fo.innerHTML='<span class="dim">Running…</span>';
  const lines=B.code.split("\n");
  lines[B.bug_line-1]=val;
  const r=await runCode(lines.join("\n")+(B.extra?"\n"+B.extra:""));
  running=false;
  if(!bs||bs.phase!=="fix")return;
  $("fxrun").disabled=false;
  bs.runs++;
  const extraN=B.extra?B.extra.split("console.log").length-1:0,vis=B.out.length-extraN;
  const shown=r.out.slice(0,vis).map(esc).join("\n")||"(nothing)";
  bs.fail=r.ok?{out:r.out,vis}:{err:r.err,timeout:!!r.timeout};
  if(!r.ok){
    plog("run",{ok:false,why:"crash"});
    fo.innerHTML=`<span class="bad">Your code crashed: ${esc(r.err)}</span>\n<span class="dim">Check the syntax. No heart lost for crashes.</span>`;
    return
  }
  if(same(r.out,B.out)){
    plog("run",{ok:true,n:bs.runs});
    bs.byteTxt="";
    fo.innerHTML=`<span class="ok">✅ It printed:</span>\n${shown}\n<span class="ok">That's exactly what was expected!</span>`;
    bs.phase="fixed";
    bs.fixedLine=val.trim();
    $("fxrun").disabled=true;
    $("msg").textContent="Bug fixed! Now throw the net…";
    setTimeout(()=>{
      if(bs&&bs.phase==="fixed")startNet()
    },1000);
    return
  }
  const visOK=same(r.out.slice(0,vis),B.out.slice(0,vis));
  fo.innerHTML=`<span class="bad">✗ It printed:</span>\n${shown}\n<span class="dim">Expected:</span>\n${B.out.slice(0,vis).map(esc).join("\n")}`+(visOK?'\n<span class="bad">It works for the example, but fails a hidden check with other inputs. Fix the logic itself.</span>':"");
  plog("run",{ok:false,why:visOK?"hidden":"output"});
  lose("Not quite. ");
}
// ---------- STEP 4 (bonus): throw the net. The ring passes the sweet spot and keeps shrinking; doing nothing = a miss ----------
const qc=$("qc"),q=qc.getContext("2d");
const NET_R=p=>200-190*p;   // radius: 200 -> 10; the sweet spot (40) is crossed at p=0.84
function startNet(){
  bs.phase="net";
  bs.qs=performance.now();
  bs.dur=2000;
  show("menu",false);
  const d=dprv();
  qc.width=Math.round(innerWidth*d);
  qc.height=Math.round(innerHeight*d);
  qc._d=d;
  qc.style.display="block"
}
function netFrame(now){
  const d=qc._d||1,w=qc.width/d,h=qc.height/d,cx=w/2,cy=h*.45,u=Math.min(w,h)/576;
  q.setTransform(d,0,0,d,0,0);
  const p=Math.min(1,(now-bs.qs)/bs.dur),r=NET_R(p)*u;
  q.clearRect(0,0,w,h);
  q.fillStyle="rgba(6,17,11,.93)";
  q.fillRect(0,0,w,h);
  bugSprite(q,bs.vis,cx,cy+160*u,250*u,now);
  q.lineWidth=Math.max(3,6*u);
  q.strokeStyle="#7fd89a";
  q.beginPath();
  q.arc(cx,cy,40*u,0,7);
  q.stroke();       // sweet spot
  q.strokeStyle="#e8a24a";
  q.beginPath();
  q.arc(cx,cy,Math.max(2,r),0,7);
  q.stroke();                           // closing net
  q.fillStyle="#e8eeff";
  q.font="bold "+Math.max(16,22*u)+"px 'Courier New'";
  q.textAlign="center";
  q.fillText("THROW THE NET! Press Enter (or tap) when the rings meet",cx,Math.max(40,60*u));
  q.font=Math.max(12,15*u)+"px 'Courier New'";
  q.fillStyle="#9fc7aa";
  q.fillText("Bonus XP for good timing. Don't press at all and you earn nothing extra.",cx,Math.max(64,88*u));
  if(p>=1){
    bs.phase="done0";
    qc.style.display="none";
    finish(true,"MISS")
  }
}
function throwNet(now){
  if(!bs||bs.phase!=="net"||now-bs.qs<300)return;     // ignore the Enter that submitted the fix
  const p=Math.min(1,(now-bs.qs)/bs.dur),d=Math.abs(NET_R(p)-40);
  const grade=d<10?"PERFECT":d<28?"GOOD":"MISS";
  bs.phase="done0";
  qc.style.display="none";
  finish(true,grade);
}
qc.onclick=()=>throwNet(performance.now());
// ---------- result ----------
function finish(win,grade=""){
  bs.phase="done";
  bs.won=win;
  S.tut=true;
  show("menu",false);
  show("picked",false);
  show("code",false);
  show("hint",false);
  show("hintbtn",false);
  show("fxbar",false);
  show("fxout",false);
  show("result",true);
  show("goal",false);
  bs.atkAt=performance.now();
  const real=SPECIES[B.category],sp=real[0];
  $("fn").textContent=sp.toUpperCase();
  $("ft").textContent=B.title+" · "+B.category;   // the species is only revealed now
  if(win){
    const bonus={PERFECT:20,GOOD:8,MISS:0}[grade]||0,first=bs.runs==1?10:0;
    const gain=Math.max(10,30-Math.max(0,bs.hints-1-(S.q2.chest?1:0))*8+(bs.tut?0:Math.min(bs.lives,5)*3)+bonus+first+(bs.rival?40:0)+(bs.typeBonus||0)+(bs.quest?20:0)+(bs.vis.shiny?30:0)+(bs.daily&&bs.didx==2?50:0));
    S.xp+=gain;
    S.catches++;
    $("fhp").style.width="0%";
    bs.caughtAt=performance.now();
    const st=S.stats[B.category]=S.stats[B.category]||{hit:0,miss:0};
    st.hit++;
    const t=today();
    if(S.last!=t){
      S.streak=S.last==yesterday()?S.streak+1:1;
      S.last=t
    }
    if(bs.daily){
      S.daily={date:today(),n:Math.max(dailyN(),bs.didx+1)};
      if(S.daily.n>=3)S.dailyDone=today()
    }
    const d=S.dex[B.category]=S.dex[B.category]||{n:0,titles:[],shiny:0};
    d.n++;
    if(bs.vis.shiny)d.shiny=(d.shiny||0)+1;
    if(!d.titles.includes(B.title))d.titles.push(B.title);
    if(bs.reg===2){
      const k=bs.quest,q2=S.q2;
      if(k==="compiler")q2.done=true;
      else if(k==="chest")q2.chest=true;
      else if(k)q2[k]=true;
      if(bs.rival)q2.rival=true
    }
    else if(bs.quest==="compiler")S.q.done=true;
    else if(bs.quest)S.q.fixed[bs.quest]=true;
    if(bs.rival&&bs.reg!==2){
      S.r1done=true;
      S.q.nullo=true
    }
    $("msg").textContent="Nice work! You really debugged it.";
    $("result").innerHTML=`<div class="big okc">✅ Caught! It was ${art(sp)} ${esc(sp)}</div><div>${esc(real[2])}</div>
   <div class="fix"><b>Your fix:</b> <code>${esc(bs.fixedLine||B.fix)}</code></div>
   <div class="fix"><b>A textbook fix:</b> <code>${esc(B.fix)}</code></div><p>${esc(B.explanation)}</p>
   <div class="sm">+${gain} XP${grade?" · net: "+grade:""}${first?" · fixed on the first run (+10)":""}${bs.daily?" · daily "+(bs.didx+1)+"/3"+(bs.didx==2?" complete (+50)":""):""}</div><button data-act="end">Continue ▶ (Enter)</button>`;
  }else{
    $("msg").textContent="No worries. Reading the fix is how you learn.";
    $("result").innerHTML=`<div class="big noc">The ${esc(sp)} got away!</div><div>The bug was on line ${B.bug_line}: a <b>${esc(B.category)}</b> mistake.</div><div class="fix"><b>The fix:</b> <code>${esc(B.fix)}</code></div><p>${esc(B.explanation)}</p><button data-act="end">Continue ▶ (Enter)</button>`;
  }
  plog("end",{win,grade,runs:bs.runs,hints:bs.hints,byteAsks:bs.byteAsks,secs:Math.round((Date.now()-bs.t0)/1000)});
  save();
  hud();
}
function endBattle(){
  const rival=bs.rival,won=bs.won,daily=bs.daily,quest=bs.quest,reg=bs.reg;
  $("battle").classList.remove("on");
  qc.style.display="none";
  bs=null;
  mode="walk";
  prefetchAI();
  if(reg===2){
    if(won&&(quest||rival))afterQuest2(quest||"rival");
    else if(rival)say(["NULLO: Not yet. Come back when you have thought it through."]);
    return
  }
  if(daily&&won&&dailyN()<3){
    const n=dailyN();
    say(["Daily bug "+n+" of 3 cleared! Press Enter for the next one."],()=>startDaily());
    return
  }
  if(won&&quest&&quest!=="compiler"){
    buildMeadow();
    hud();
    const sy=SYS.find(x=>x.key===quest),n=qFixed();
    say([sy.after,n<3?"("+n+" of 3 systems fixed)":"All three systems are back online! Go and tell Prof. Semicolon."]);
    return
  }
  if(won&&quest==="compiler"){
    buildMeadow();
    hud();
    say(["THE MEADOW COMPILER: Build succeeded. 0 errors. Thank you, Debugger.","Colour floods back through the village..."],()=>{
      P.x=7;
      P.y=9;
      P.ox=7;
      P.oy=9;
      P.nx=7;
      P.ny=9;
      P.moving=false;
      P.prog=0;
      BYT.x=7;
      BYT.y=9;
      syncGates();
      buildMeadow();
      hud();
      endCard()
    });
    return
  }
  if(rival&&won){
    M[8][28]=".";
    buildMeadow();
    say(["NULLO: ...You actually read the code. Huh.","NULLO: I always smashed first and asked later. Maybe that's why my Bugs keep coming back.","NULLO: The gate's open. Syntax Forest is darker. Be careful, Debugger."])
  }
  else if(rival)say(["NULLO: Told you. Speed wins. Come back when you're ready."]);
}
function endCard(){
  say(["REGION 1 COMPLETE: THE MEADOW MAINFRAME IS RESTORED","The village has light, water, a ringing bell and its Compiler back. Look at the flowers!",`Bugs caught: ${S.catches}  ·  XP: ${S.xp}  ·  🔥 streak: ${S.streak}`,"The road south is open: follow it to the Syntax Forest."]);
}
