// battle.js: Battle: pick the line, name the mistake, fix and run, net throw, result
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- battle ----------
let B=null,bs=null,lastTitle="";
function pickBug(){
  const home=S.starter||"js";
  if(!S.tut)return BANK.find(b=>b.tut&&b.lang===home)||BANK.find(b=>b.tut);
  const tmax=S.catches<3?1:S.catches<8?2:3;
  const pool=REG===2?BANK.filter(b=>!b.quest&&!b.quest2&&b.title!==lastTitle&&(b.r2||(TIER[b.title]||2)>=2)):BANK.filter(b=>!b.quest&&!b.r2&&b.title!==lastTitle&&(TIER[b.title]||2)<=tmax);
  // more Bugs of the kinds you miss; your partner's language dominates the first few hunts, then every language is common
  const w=pool.map(b=>{
    const s=S.stats[b.category]||{hit:0,miss:0};
    return Math.max(1,1+s.miss*1.5-s.hit*0.4)*(b.lang===home?(S.catches<3?6:1.4):1)
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
  if(mode!=="walk")return;
  if(!S.starter){
    say(["Daily hunts start once you have a partner. Visit Prof. Semicolon's lab first!"]);
    return
  }
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
// tiny syntax highlighter so the code reads like an editor: comments, strings, keywords, numbers, function calls
const HL={js:/(\/\/.*$)|("[^"]*"|'[^']*')|\b(const|let|var|function|return|if|else|for|while|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b|\b([a-zA-Z_]\w*)(?=\()/g,
 py:/(#.*$)|("[^"]*"|'[^']*')|\b(def|return|if|elif|else|for|while|in|not|and|or|True|False|None|import|from|global)\b|\b(\d+(?:\.\d+)?)\b|\b([a-zA-Z_]\w*)(?=\()/g,
 lua:/(--.*$)|("[^"]*"|'[^']*')|\b(local|function|return|if|then|elseif|else|end|for|while|do|repeat|until|in|not|and|or|true|false|nil)\b|\b(\d+(?:\.\d+)?)\b|\b([a-zA-Z_]\w*)(?=\()/g};
function hl(l,lang){
  return esc(l).replace(HL[lang]||HL.js,
  (m,cm,st,kw,nu,fn)=>cm?'<span class="c">'+m+'</span>':st?'<span class="s">'+m+'</span>':kw?'<span class="k">'+m+'</span>':nu?'<span class="n">'+m+'</span>':'<span class="f">'+m+'</span>')
}
function show(id,on){
  $(id).style.display=on?"":"none"
}
function renderCode(edit){
  $("code").innerHTML=B.code.split("\n").map((l,i)=>(edit&&i==B.bug_line-1)
  ?`<div class="ln edit" data-n="${i}"><b>${i+1}</b><input id="fxin" value="${esc(l).replace(/"/g,"&quot;")}" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off"></div>`
  :`<div class="ln" data-n="${i}" role="button" tabindex="0"><b>${i+1}</b><pre>${hl(l,B.lang)||" "}</pre></div>`).join("")
}
function startBattle(rival,opts={}){
  mode="battle";
  flash=300;
  const ai=(!rival&&!opts.daily&&S.tut)?AIQ.shift():null;
  B=opts.bug||(ai||pickBug());
  B.lang=B.lang||"js";
  lastTitle=B.title;
  warmUp(B.lang);   // start loading Python / Lua now, so it is ready by the time you press RUN
  // a partner who speaks the Bug's language gives all three hints, explains failed runs and adds one try
  const partner=hasPartner(B.lang)?B.lang:null;
  const vis=makeVis(pick(catList()),rival),tut=!S.tut&&!rival&&!opts.daily,max=tut||DEV?99:(opts.lives||(S.catches<3?5:3))+(partner?1:0);   // the look is random: it never reveals the mistake
  bs={phase:"line",cur:0,lives:max,max,hints:0,maxHints:partner||tut?3:1,hintTxt:"",hintBy:"",crossed:new Set(),opts:[],ci:0,rival,won:false,vis,tut,daily:!!opts.daily,didx:opts.idx||0,runs:0,typeTries:0,quest:opts.quest||null,reg:REG,byteAsks:0,fail:null,byteTxt:"",t0:Date.now(),lang:B.lang,partner};
  if(opts.quest==="compiler")vis.scale=1.25;
  $("battle").classList.add("on");
  document.documentElement.classList.add("inbattle");   // the bottom screen switches to the code console
  fitField();
  $("fname").textContent="mystery_bug."+LANGS[B.lang].ext;
  const lt=$("langtag");
  lt.textContent=(PETS[B.lang]?PETS[B.lang].icon+" ":"")+LANGS[B.lang].name.toUpperCase();
  lt.style.setProperty("--c",LANGS[B.lang].color);
  lt.style.setProperty("--ink",LANGS[B.lang].ink);
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
  $("ft").textContent=LANGS[B.lang].name.toUpperCase()+" type · "+(B.src=="ai"?"🤖 written by "+(B.by||"AI"):"📘 bug bank")+" · mistake unknown";
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
    bs.hintTxt=B.hints[0];
    bs.hintBy=hintVoice()
  }
  plog("start",{src:B.src||"bank",quest:opts.quest||null,rival:!!rival,daily:!!opts.daily,tut});
  paintCode();
  const lname=LANGS[B.lang].name;
  info((rival?"Nullo challenges you! ":opts.quest?"The glitch fights back! ":(opts.daily?"Daily hunt, bug "+(opts.idx+1)+" of 3! ":"A wild "+lname+" Bug appeared! "))
   +(tut?(partner?"":"(Practice round: every hint is open. Catch it and "+petName(B.lang)+", who speaks "+lname+", joins you!) ")
    :partner?petName(partner)+" speaks "+lname+": full hints and +1 try! ":"Nobody on your team speaks "+lname+" yet: 1 hint only. Catch this Bug and "+petName(B.lang)+" joins you! "));
  prefetchAI();
  if(DEV){
    // dev mode skips finding the line and naming the mistake: straight to the fix
    bs.cur=B.bug_line-1;
    startFix()
  }
}
function info(pre=""){
  const note=t=>'<span style="font-size:14px;letter-spacing:0">'+t+'</span>';
  $("hearts").innerHTML=DEV?note("🛠 Dev mode: unlimited tries"):bs.tut?note("Practice round: unlimited tries")
   :"❤️".repeat(Math.max(0,bs.lives))+"🖤".repeat(Math.max(0,bs.max-bs.lives))+" "+note(bs.lives+" of "+bs.max+" tries left");
  $("hearts").setAttribute("aria-label",DEV||bs.tut?"Unlimited tries":bs.lives+" of "+bs.max+" tries left");
  $("hearts").style.display="";
  $("goal").innerHTML=`<b>GOAL:</b> ${esc(B.task)}<div class="chips"><span class="e">Expected: <code>${esc(B.expected)}</code></span><span class="g">Got: <code>${esc(B.actual)}</code></span></div>`;
  const ins={line:bs.tut?"STEP 1: Click the line where Got goes wrong.":"Click the BUGGY line.",
  type:"STEP 2: Which label fits best? (Practice only: no heart is lost.) Click one, or press 1-"+bs.opts.length+".",
  fix:"STEP 3: Edit the highlighted line so the program prints what's Expected, then press RUN (Enter)."}[bs.phase]||"";
  $("msg").textContent=pre+ins;
  $("battle").dataset.phase=$("console").dataset.phase=bs.phase;   // small screens re-balance the panels per step (see game.css)
  show("goal",bs.phase!="done");
  $("fhp").style.width=({line:100,type:66,fix:33,fixed:0,done0:0,done:bs.won?0:100})[bs.phase]+"%";
  const pv=bs.partner?PETS[bs.partner].icon+" <b>"+petName(bs.partner)+":</b> ":"🎓 <b>PROF:</b> ";
  const h=$("hint"),hh=(bs.hintTxt?(bs.hintBy||"💡 <b>PROF:</b> ")+esc(bs.hintTxt):"")+(bs.byteTxt?(bs.hintTxt?"<br>":"")+pv+bs.byteTxt:"");
  if(hh&&bs.phase!="done"){
    h.style.display="";
    h.innerHTML=hh
  }else h.style.display="none";
  const left=bs.maxHints-bs.hints;
  $("hintbtn").textContent=left>0?"💡 HINT ("+left+")":(bs.maxHints<3?"🔒 "+LANGS[bs.lang].name.toUpperCase()+" PARTNER":"💡 HINT (0)");
  $("hintbtn").title=bs.maxHints<3?"More hints need a partner who speaks "+LANGS[bs.lang].name:"";
  $("hintbtn").disabled=left<=0;
  const ask=$("byteask");
  ask.textContent=bs.partner?PETS[bs.partner].icon+" ASK "+petName(bs.partner):"🎓 ASK PROF";
  ask.title=bs.partner?petName(bs.partner)+" explains your last failed run":"The Prof gives a short answer; a "+LANGS[bs.lang].name+" partner would explain more";
}
// who gives the hints: your partner if one speaks the Bug's language, otherwise the Prof (just one hint)
function hintVoice(){
  return bs.partner?PETS[bs.partner].icon+" <b>"+petName(bs.partner)+":</b> ":"💡 <b>PROF:</b> "
}
function takeHint(){
  if(!bs||bs.hints>=bs.maxHints){
    if(bs&&bs.maxHints<3)info("No more hints: nobody on your team speaks "+LANGS[bs.lang].name+". ");
    return
  }
  bs.hintTxt=B.hints[bs.hints++];
  bs.hintBy=hintVoice();
  plog("hint",{n:bs.hints});
  info()
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
  info(msg+(bs.tut||DEV?"":"(-1 try, "+bs.lives+" left) "));
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
  const vis0=B.out.length-(B.extra?B.extra.split("\n").filter(l=>l.trim()).length:0);
  $("fxout").innerHTML='<span class="dim">Press RUN to see what your program prints. Expected:</span>\n'+B.out.slice(0,vis0).map(esc).join("\n");
  $("fxrun").disabled=false;   // the last battle's win left it disabled
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
function autoFix(){
  // dev mode only: type in the textbook fix and run it (still verified by actually running the program)
  if(!DEV||!bs||bs.phase!=="fix")return;
  const i=$("fxin");
  if(i){
    i.value=B.fix;
    runFix()
  }
}
function giveUp(){
  if(bs&&bs.phase=="fix"){
    plog("giveup",{runs:bs.runs});
    finish(false)
  }
}
// A fake fix replaces the calculation with a constant (const perFriend = 3; / return 72;).
// Caught when the textbook fix computes its value from other names but the player's line computes it from none.
const KW=new Set(["const","let","var","return","true","false","null","undefined","new","typeof","Math","String","Number","console","log",
 "local","nil","and","or","not","tostring","tonumber","True","False","None","print","int","str","float","len"]);
function readsNames(rhs){
  return(String(rhs).replace(/(["'`])(?:\\.|(?!\1).)*\1/g,"").match(/[A-Za-z_$][\w$]*/g)||[]).filter(n=>!KW.has(n)).length>0
}
function valueOf(line){
  const s=line.trim().replace(/;\s*$/,""),r=s.match(/^return\b(.*)$/);
  if(r)return r[1];
  const a=s.match(/^(?:(?:const|let|var|local)\s+)?[\w$.\[\]]+\s*(?:[+\-*/%]|\*\*|\/\/)?=(?!=)(.*)$/);
  return a?a[1]:null
}
function hardcoded(val,fix){
  const v=valueOf(val),f=valueOf(fix);
  return v!==null&&f!==null&&readsNames(f)&&!readsNames(v)
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
    // error messages differ per language: JavaScript "x is not defined", Python "NameError: name 'x' is not defined",
    // Lua "attempt to perform arithmetic on a nil value (global 'x')"
    const e=f.err,name=(e.match(/name '(\w+)' is not defined/)||e.match(/(?:variable:\s*|global ')(\w+)/)||e.match(/(\w+) is not defined/)||[])[1];
    if(f.timeout||/too much output/i.test(e))t="your program never finishes (or prints forever). A loop isn't moving toward its stop condition. Check what changes each time round.";
    else if(name||/not defined|find variable/i.test(e))t="it uses a name the computer doesn't know"+(name?" ("+q2(name)+")":"")+". Compare the spelling with the variables in the code above"+(B.lang==="lua"?", and remember a local variable disappears at the end of its block.":".");
    else if(/IndentationError|unindent|expected an indented/i.test(e))t="the spaces at the start of your line don't line up. In Python the indentation shows which block a line belongs to: keep the same spaces as the line had before.";
    else if(/syntax|unexpected|expected near|invalid/i.test(e))t="something is missing or extra: a bracket, a quote or an operator"+(B.lang==="lua"?" (Lua writes 'not equal' as ~= and joins text with ..)":"")+". Read your line slowly, symbol by symbol.";
    else if(/TypeError|on a string value|concatenate/i.test(e))t="it mixes two kinds of value, like text and a number. "+(B.lang==="py"?"Python won't add text to a number: convert one of them first (int() or str()).":B.lang==="lua"?"In Lua, + is only for numbers and .. joins text. Is a value nil (missing) or of the wrong kind?":"Check the kind of each value your line uses.");
    else if(/IndexError|out of range/i.test(e))t="it reads past the end of a list or a word. Positions start at 0, so the last one is at length - 1.";
    else if(/nil value/i.test(e))t="a value is nil, which means missing. Is a variable created where it can't be seen, or a function not returning anything?";
    else t="it crashed with "+q2(e)+". Look at the values your line uses.";
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
      if(/^(undefined|None|nil)$|\b(undefined|None|nil)\b/.test(A))t+="'"+(A.match(/undefined|None|nil/)||["undefined"])[0]+"' means a value was never given back, or the wrong thing was read.";
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
  if(!bs.partner){
    // without a partner who speaks this language, the Prof only says WHAT failed, not what it suggests
    const parts=t.split(/(?<=\.)\s/),first=parts[0].length<40&&parts[1]?parts[0]+" "+parts[1]:parts[0];
    t=first+" <i>(A "+langName(B.lang)+" partner would explain more.)</i>"
  }
  bs.byteTxt=t;
  info()
}
async function runFix(){
  if(!bs||bs.phase!=="fix"||running)return;
  const inp=$("fxin"),orig=B.code.split("\n")[B.bug_line-1],lang=B.lang||"js",pr=LANGS[lang].print;
  let val=(inp.value||"").replace(/\s+$/,"");
  // Python cares about indentation: if the player's line lost its leading spaces, put the original ones back
  const indent=orig.match(/^\s*/)[0];
  if(val.trim()&&!/^\s/.test(val)&&indent)val=indent+val;
  const fo=$("fxout");
  if(!val.trim()||val.trim()===orig.trim()){
    fo.innerHTML='<span class="bad">Change something first. Look at Expected vs Got, then edit the line.</span>';
    return
  }
  if(pr.test(val)&&!pr.test(orig)){
    fo.innerHTML='<span class="bad">Fix the logic. Printing the answer yourself doesn\'t count!</span>';
    return
  }
  if(hardcoded(val,B.fix)){
    plog("run",{ok:false,why:"hardcoded"});
    fo.innerHTML='<span class="bad">That just types in the answer. Repair the calculation so it works out the answer itself.</span>\n<span class="dim">No try lost.</span>';
    return
  }
  running=true;
  $("fxrun").disabled=true;
  fo.innerHTML='<span class="dim">Running…</span>';
  const lines=B.code.split("\n");
  lines[B.bug_line-1]=val;
  const r=await runCode(lines.join("\n")+(B.extra?"\n"+B.extra:""),900,lang,msg=>{
    fo.innerHTML='<span class="dim">'+esc(msg)+'</span>'
  });
  running=false;
  if(!bs||bs.phase!=="fix")return;
  $("fxrun").disabled=false;
  bs.runs++;
  const extraN=B.extra?B.extra.split("\n").filter(l=>l.trim()).length:0,vis=B.out.length-extraN;
  const shown=r.out.slice(0,vis).map(esc).join("\n")||"(nothing)";
  bs.fail=r.ok?{out:r.out,vis}:{err:r.err,timeout:!!r.timeout};
  if(!r.ok&&r.load){
    fo.innerHTML=`<span class="bad">${esc(r.err)}</span>\n<span class="dim">Check your connection and press RUN again. No try lost.</span>`;
    return
  }
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
    $("msg").textContent=DEV?"Bug fixed!":"Bug fixed! Now throw the net…";
    setTimeout(()=>{
      if(bs&&bs.phase==="fixed")DEV?finish(true):startNet()
    },DEV?600:1000);
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
function sizeNet(){
  // the net covers the game screen (not the whole window: on a phone the controls stay usable around it)
  const d=dprv(),box=$("screen");
  qc.width=Math.round(box.clientWidth*d);
  qc.height=Math.round(box.clientHeight*d);
  qc._d=d
}
function startNet(){
  bs.phase="net";
  bs.qs=performance.now();
  bs.dur=2000;
  show("menu",false);
  sizeNet();
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
  q.textAlign="center";
  const narrow=w<520;
  q.font="bold "+Math.max(14,22*u)+"px 'Courier New'";
  q.fillText(narrow?"THROW THE NET!":"THROW THE NET! Press Enter (or tap) when the rings meet",cx,Math.max(36,60*u));
  q.font=Math.max(11,15*u)+"px 'Courier New'";
  q.fillStyle="#9fc7aa";
  q.fillText(narrow?"Press A (or tap) when the rings meet":"Bonus XP for good timing. Don't press at all and you earn nothing extra.",cx,Math.max(58,88*u));
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
    S.langCatch[B.lang]=(S.langCatch[B.lang]||0)+1;
    // the first Bug you catch in a new language brings that language's partner onto your team
    bs.joined=!hasPartner(B.lang)&&recruit(B.lang)?B.lang:null;
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
   ${bs.joined?`<div class="joined" style="--c:${LANGS[bs.joined].color}"><img src="${petThumb(bs.joined)}" alt="" width="48" height="48"><div><b>${petName(bs.joined)} joined your team!</b><br>${LANGS[bs.joined].name} Bugs now get all three hints, full explanations and +1 try.</div></div>`:""}
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
  const v={rival:bs.rival,won:bs.won,daily:bs.daily,quest:bs.quest,reg:bs.reg},joined=bs.joined;
  $("battle").classList.remove("on");
  document.documentElement.classList.remove("inbattle");
  qc.style.display="none";
  bs=null;
  mode="walk";
  prefetchAI();
  if(joined){
    const p=PETS[joined];
    say([`The ${langName(joined)} Bug shakes off its glitch... and it's ${p.name}!`,`${p.name}: ${p.blurb}`,`${p.name} joined your team! From now on, ${langName(joined)} Bugs get all three hints, full explanations and +1 try.`],()=>afterBattle(v));
    return
  }
  afterBattle(v)
}
function afterBattle({rival,won,daily,quest,reg}){
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
      placeAt(R1.home[0],R1.home[1],0);
      syncGates();
      buildMeadow();
      hud();
      endCard()
    });
    return
  }
  if(rival&&won){
    M[R1.nullo[1]][R1.nullo[0]]=".";
    buildMeadow();
    say(["NULLO: ...You actually read the code. Huh.","NULLO: I always smashed first and asked later. Maybe that's why my Bugs keep coming back.","NULLO: The stairs are yours. The Compiler is up there, and past it, Syntax Forest. Be careful, Debugger."])
  }
  else if(rival)say(["NULLO: Told you. Speed wins. Come back when you're ready."]);
}
function endCard(){
  say(["REGION 1 COMPLETE: THE MEADOW MAINFRAME IS RESTORED","The village has light, water, a ringing bell and its Compiler back. Look at the flowers!",`Bugs caught: ${S.catches}  ·  XP: ${S.xp}  ·  🔥 streak: ${S.streak}`,"The north-east trail past the Compiler is open: follow it to the Syntax Forest."]);
}
