// ui.js: Bugdex, keyboard, touch pad, button dispatch, test hook, boot
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- dex ----------
function toggleDex(){
  if(mode=="dex"){
    $("dexov").classList.remove("on");
    mode="walk";
    return
  }
  if(mode!="walk")return;
  mode="dex";
  const rows=CATS8.map(c=>{
    const d=S.dex[c],s=S.stats[c]||{hit:0,miss:0};
    return `<div style="margin:5px 0;display:flex;gap:8px;align-items:center"><img src="${thumb(c,!!d)}" width="36" height="36" style="flex:none"><div>${d?`<b>${SPECIES[c][0]}</b> ×${d.n} · ${SPECIES[c][2]}<br>&nbsp;&nbsp;caught: ${d.titles.join(", ")} · hits ${s.hit}/misses ${s.miss}${d.shiny?" · ✨ shiny x"+d.shiny:""}`:`??? (undiscovered ${c} bug)`}</div></div>`
  }).join("");
  const weak=CATS8.map(c=>[c,(S.stats[c]||{miss:0}).miss]).sort((a,b)=>b[1]-a[1])[0];
  $("dex").innerHTML=rows+`<hr>Species found: ${Object.keys(S.dex).length}/${CATS8.length}`+(weak[1]>0?`<br>🎓 PROF: "You trip on <b>${weak[0]}</b> bugs most. Expect more of them."`:"");
  $("dexov").classList.add("on");
}
// ---------- keys ----------
function onKey(k){
  if(k=="`"){
    // the backquote key switches dev mode on or off (reloads the page, each mode has its own save)
    const u=new URL(location.href);
    DEV?u.searchParams.delete("dev"):u.searchParams.set("dev","1");
    location.href=u.href;
    return
  }
  if(k=="f"&&mode!="dialog"){
    showFps=!showFps;
    $("hf").style.display=showFps?"":"none";
    return
  }
  if(mode=="dialog"){
    if(k=="enter"||k==" ")dlg&&dlg.advance();
    return
  }
  if(mode=="dex"){
    if(k=="b"||k=="escape")toggleDex();
    return
  }
  if(mode=="walk"){
    if(k=="enter"||k==" "){
      if(!P.moving)interact()
    }else if(k=="b")toggleDex();
    else if(k=="t")startDaily();
    return
  }
  if(mode=="battle"&&bs){
    if(bs.phase=="net"){
      if(k=="enter"||k==" ")throwNet(performance.now());
      return
    }
    if(bs.phase=="fixed"||bs.phase=="done0")return;
    if(bs.phase=="fix"){
      if(k=="h"&&bs.hints<3){
        bs.hintTxt=B.hints[bs.hints++];
        plog("hint",{n:bs.hints});
        info()
      }
      return
    }
    if(bs.phase=="done"){
      if(k=="enter"||k==" ")endBattle();
      return
    }
    if(k=="escape"){
      plog("abandon");
      endBattle();
      return
    }
    if(k=="h"&&bs.hints<3){
      bs.hintTxt=B.hints[bs.hints++];
      plog("hint",{n:bs.hints});
      info();
      return
    }
    if(bs.phase=="line"){
      const n=B.code.split("\n").length;
      if(k=="arrowdown"||k=="s"){
        do{
          bs.cur=(bs.cur+1)%n
        }while(bs.crossed.has(bs.cur));
        paintCode()
      }
      else if(k=="arrowup"||k=="w"){
        do{
          bs.cur=(bs.cur-1+n)%n
        }while(bs.crossed.has(bs.cur));
        paintCode()
      }
      else if(k=="enter"||k==" ")pickLine();
    }else if(bs.phase=="type"){
      const n=bs.opts.length;
      if(k=="arrowdown"||k=="arrowright"||k=="s"||k=="d"){
        bs.ci=(bs.ci+1)%n;
        paintMenu()
      }
      else if(k=="arrowup"||k=="arrowleft"||k=="w"||k=="a"){
        bs.ci=(bs.ci-1+n)%n;
        paintMenu()
      }
      else if(k=="enter"||k==" ")pickType();
      else if(k>="1"&&k<="4"&&bs.opts[+k-1]){
        bs.ci=+k-1;
        pickType()
      }
    }
  }
}
// ---------- touch controls (phones/tablets) ----------
document.querySelectorAll("#pad [data-k]").forEach(b=>{
  const k=b.dataset.k;
  const on=e=>{
    e.preventDefault();
    keys[k]=true
  },off=e=>{
    e.preventDefault();
    delete keys[k]
  };
  b.addEventListener("pointerdown",on);
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,off))
});
document.querySelectorAll("#pad [data-a]").forEach(b=>b.addEventListener("pointerdown",e=>{
  e.preventDefault();
  onKey(b.dataset.a)
}));
// ---------- buttons: one delegated handler instead of inline onclick attributes ----------
const ACTIONS={devskip:()=>devSkip(),autofix:()=>autoFix(),daily:()=>startDaily(),hint:()=>onKey("h"),run:()=>runFix(),reset:()=>resetFix(),ask:()=>byteAsk(),giveup:()=>giveUp(),dex:()=>toggleDex(),end:()=>endBattle()};
document.addEventListener("click",e=>{
  const a=e.target.closest&&e.target.closest("[data-act]");
  if(a&&ACTIONS[a.dataset.act])ACTIONS[a.dataset.act]()
});
// ---------- read-only window onto the game state, for the integration tests (selftest.html) ----------
window.__gl={get S(){
  return S
},get P(){
  return P
},get B(){
  return B
},get bs(){
  return bs
},get M(){
  return M
},get REG(){
  return REG
},get dlg(){
  return dlg
},get artReady(){
  return artReady
},
 get mode(){
  return mode
},set mode(v){
  mode=v
},get BANK(){
  return BANK
},qFixed,repairsDone,SAVE_KEY,R1};
// ---------- dev mode: finish Region 1 in one click ----------
function devSkip(){
  if(!DEV||mode!=="walk"||P.moving||REG!==1)return;
  S.tut=true;
  S.intro=true;
  S.q={on:true,fixed:{lamp:true,pump:true,bell:true},nullo:true,done:true};
  S.r1done=true;
  REG1.M[R1.nullo[1]][R1.nullo[0]]=".";
  syncGates();
  buildMeadow();
  enterForest();
  plog("devskip")
}
if(DEV){
  $("devfix").style.display="";
  document.title="Glitchlands (dev)";
  $("hl").href="index.html?dev=1";
  $("keys").textContent+=" · ` dev mode off"
}
// ---------- boot ----------
if(S.r1done||S.q.nullo)REG1.M[R1.nullo[1]][R1.nullo[0]]=".";
syncGates();
if(S.pos&&S.pos.r===2&&S.region===2){
  setRegion(2);
  placeAt(S.pos.x,S.pos.y,0)
}else buildMeadow();
hud();
if(!S.intro){
  mode="dialog";
  S.intro=true;
  save();
  say(["Long ago the Great Compiler kept every program in the Glitchlands running clean.","One night it crashed. Bugs, living mistakes, poured out and hid in the tall grass.","You are a new Debugger. Walk with the arrow keys or WASD. Follow the path north to the lab on the hill, then press Enter to talk to Prof. Semicolon (the white-haired one)."])
}
else mode="walk";
requestAnimationFrame(loop);
