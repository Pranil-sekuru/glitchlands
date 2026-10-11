// loop.js: Main loop, movement, HUD, random encounters
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- main loop (time-based). Movement, collision and the follower live in physics.js ----------
let last=0,fpsN=0,fpsT=0,showFps=false;
function loop(t){
  requestAnimationFrame(loop);   // scheduled first, so one bad frame can never freeze the game
  const dt=Math.min(64,t-last||16);
  last=t;
  fpsN++;
  fpsT+=dt;
  if(fpsT>=500){
    const f=Math.round(fpsN*1000/fpsT);
    fpsN=0;
    fpsT=0;
    if(showFps)$("hf").textContent=f+" FPS"
  }
  if(flash>0)flash-=dt;
  updateDoorTravel(t);
  advanceVillage(dt,t);
  area.style.visibility=mode==="battle"||mode==="starter"||mode==="dex"?"hidden":"";
  if(mode=="walk")stepPlayer(dt);
  else haltPlayer();
  if(mode=="walk"||mode=="dialog"||mode=="door"){
    ensureCollision(dt);
    updateNPCs(dt)
  }
  if(mode!=="dialog")npcsHere().forEach(n=>n.talking=false);
  try{
    draw(t,dt);
    if(mode=="starter")starterFrame(t);
    if(bs&&bs.phase=="net")netFrame(t);
    else if(mode=="battle"&&bs)foeFrame(t)
  }catch(e){
    if(!window._loopErr){
      window._loopErr=1;
      console.error("frame error:",e)
    }
  }
}
function hud(){
  const place=REG===2?"SYNTAX FOREST":REG===0?ROOMS[ROOM].title:"MEADOW MAINFRAME";
  $("hl").textContent="GLITCHLANDS · "+place;
  if($("ploc"))$("ploc").textContent=place;
  // the team: one face per language, dark until that partner has joined
  $("hteam").innerHTML=PET_ORDER.map(l=>`<img src="${petThumb(l,!hasPartner(l))}" alt="" width="22" height="22">`).join("");
  $("hteam").setAttribute("aria-label","Team: "+(S.team.length?S.team.map(l=>petName(l)+" ("+langName(l)+")").join(", "):"no partner yet"));
  $("hteam").style.display=S.starter?"":"none";
  if($("pteam"))$("pteam").innerHTML=$("hteam").innerHTML;
  const qe=$("quest");
  if(qe)qe.textContent=(REG===2?questText2():!S.starter?(S.leftHome||REG===1?"Visit Prof. Semicolon (by his lab on the north-west hill)":ROOM==="home-up"?"Head downstairs: Mom is waiting":"Talk to Mom, then head out the door"):questText());
  $("mgoal").textContent="🎯 "+qe.textContent;   // the goal lives in the menu (and is announced to screen readers), not on screen
  $("hx").innerHTML=`<span class="xpw">XP </span>${S.xp} · 🔥${S.streak} · 🐛${S.catches}`;
  $("devbtn").style.display=DEV&&REG===1?"":"none";
  const db=$("dailybtn");
  if(db){
    db.innerHTML="📅<span class=\"t\"> DAILY</span>"+(dailyN()>=3?" ✓":dailyN()>0?" "+dailyN()+"/3":"<span class=\"t\"> HUNT</span>");
    db.setAttribute("aria-label",dailyN()>=3?"Daily hunt done":"Daily hunt, "+dailyN()+" of 3")
  }
}
function landed(){
  const c=(M[P.y]||[])[P.x];
  S.pos=REG===0?{r:0,room:ROOM,x:P.x,y:P.y}:{r:REG,x:P.x,y:P.y};   // indoors, remember which room too
  if(REG===0){
    roomLanded(c);   // doors out and stairs (house.js)
    return
  }
  if(c=="H"&&REG===1){
    beginDoorTravel("home",enterHouse);
    return
  }
  if(c=="X"&&REG===1){
    enterForest();
    return
  }
  if(c=="E"&&REG===2){
    enterVillage();
    return
  }
  if(c=="X"&&REG===2){
    forestExit();
    return
  }
  if(GRASS.has(c)&&!S.starter){
    // no partner yet: the Prof calls you back out of the grass
    const [sx,sy]=P.lastSafe,back=(P.dir+2)%4;
    say(["PROF. SEMICOLON (from up the hill): Wait! Don't go into the tall grass alone! Wild Bugs live there.","Come up to my lab in the north-west first. I have a partner for you."],()=>{
      placeAt(Math.floor(sx),Math.floor(sy),back);
      P.px=sx;
      P.py=sy
    });
    return
  }
  if(GRASS.has(c)&&P.steps>2&&Math.random()<(S.catches<1?0.3:0.13)){
    P.steps=0;
    startBattle(false)
  }
}
