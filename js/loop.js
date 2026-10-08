// loop.js: Main loop, movement, HUD, random encounters
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- main loop (time-based; leftover time carries across tiles; a quick tap turns you in place first) ----------
let last=0,fpsN=0,fpsT=0,showFps=false;
function tryMove(carry,dt){
  const d=keys.arrowup||keys.w?0:keys.arrowright||keys.d?1:keys.arrowdown||keys.s?2:keys.arrowleft||keys.a?3:-1;
  if(d<0){
    P.wait=0;
    return false
  }
  if(d!==P.dir){
    P.dir=d;
    P.wait=80
  }
  if(P.wait>0){
    P.wait-=dt;
    return false
  }
  const nx=P.x+DIRS[d][0],ny=P.y+DIRS[d][1];
  if(nx<0||ny<0||nx>=W||ny>=H||SOLID.has(M[ny][nx]))return false;
  P.moving=true;
  P.nx=nx;
  P.ny=ny;
  P.prog=carry;
  return true
}
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
  if(mode=="walk"){
    if(P.moving){
      P.prog+=dt/150;
      P.walk+=dt/300;
      if(P.prog>=1){
        const carry=P.prog-1;
        PUFFS.push({x:P.x*T+16,y:P.y*T+30,t:performance.now()});
        P.ox=P.x;
        P.oy=P.y;
        P.x=P.nx;
        P.y=P.ny;
        P.moving=false;
        P.prog=0;
        P.steps++;
        landed();
        if(mode=="walk"&&!tryMove(carry,0))P.walk=0
      }
    }else if(!tryMove(0,dt))P.walk=0;
  }
  try{
    draw(t,dt);
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
  const long=$("hl").querySelector(".long");
  if(long)long.textContent=" GLITCHLANDS · "+(REG===2?"SYNTAX FOREST":"MEADOW MAINFRAME");
  const qe=$("quest");
  if(qe)qe.textContent="🎯 "+(REG===2?questText2():questText());
  $("hx").textContent=`XP ${S.xp} · 🔥${S.streak} · 🐛${S.catches}`;
  const db=$("dailybtn");
  if(db)db.textContent=dailyN()>=3?"📅 DAILY ✓":(dailyN()>0?"📅 DAILY "+dailyN()+"/3":"📅 DAILY HUNT")
}
function landed(){
  const c=M[P.y][P.x];
  S.pos={r:REG,x:P.x,y:P.y};
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
  if(GRASS.has(c)&&P.steps>2&&Math.random()<(S.catches<1?0.3:0.13)){
    P.steps=0;
    startBattle(false)
  }
}
