// physics.js: Free movement with tight acceleration, smooth collision shapes, wandering villagers, the follower trail
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// The maps are still tile grids (core.js), but you no longer hop tile to tile: you move freely, and walls are a smooth
// signed distance field built from a softened copy of the grid, so you glide around trees and along curved edges.
// Positions here are in tiles. The player's (P.px, P.py) is the centre of a small circle at the feet; P.x / P.y stay the
// tile under it, so everything that works per tile (doors, tall grass, saving) keeps working.
"use strict";
const PHYS={
  maxSpeed:6.4,      // tiles per second at full stick
  accel:150,         // tiles/s²: full speed in ~0.04 s
  decel:190,         // tiles/s²: stops dead in ~0.035 s, no ice
  radius:.28,        // the player's feet circle
  step:1/240,        // fixed physics step, so the feel never depends on the frame rate
  feet:.35           // sprites stand this far below their collision centre
};
const RES=8;         // distance-field cells per tile
const SMOOTH=.42;    // how much the tile grid is softened, in tiles: corners become curves and tile staircases become slopes
// tiles that are characters, not walls: they get round bodies in the NPC list instead of a square in the field
const SOFT=new Set(["P","M","V"]);
// ---------- the distance field ----------
let COL=null;        // {w, h, d: Float32Array signed distance in tiles, sig}
function edt1d(f,n,d,v,z){
  // Felzenszwalb & Huttenlocher: squared distance transform of one row in O(n)
  let k=0;
  v[0]=0;
  z[0]=-1e20;
  z[1]=1e20;
  for(let q=1;q<n;q++){
    let s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);
    while(s<=z[k]){
      k--;
      s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k])
    }
    k++;
    v[k]=q;
    z[k]=s;
    z[k+1]=1e20
  }
  k=0;
  for(let q=0;q<n;q++){
    while(z[k+1]<q)k++;
    d[q]=(q-v[k])*(q-v[k])+f[v[k]]
  }
}
function edt(mask,w,h){
  // distance (in cells) from every cell to the nearest cell where mask is 1
  const n=Math.max(w,h),g=new Float64Array(w*h),f=new Float64Array(n),d=new Float64Array(n),v=new Int32Array(n),z=new Float64Array(n+1);
  for(let i=0;i<w*h;i++)g[i]=mask[i]?0:1e20;
  for(let x=0;x<w;x++){
    for(let y=0;y<h;y++)f[y]=g[y*w+x];
    edt1d(f,h,d,v,z);
    for(let y=0;y<h;y++)g[y*w+x]=d[y]
  }
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++)f[x]=g[y*w+x];
    edt1d(f,w,d,v,z);
    for(let x=0;x<w;x++)g[y*w+x]=Math.sqrt(d[x])
  }
  return g
}
function buildCollision(){
  // 1 tile of solid border around the map, RES cells per tile
  const w=(W+2)*RES,h=(H+2)*RES,n=w*h,solid=new Uint8Array(n);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    const tx=Math.floor(i/RES)-1,ty=Math.floor(j/RES)-1,c=tx<0||ty<0||tx>=W||ty>=H?"T":M[ty][tx];
    solid[j*w+i]=SOLID.has(c)&&!SOFT.has(c)?1:0
  }
  const inv=a=>{
    const o=new Uint8Array(n);
    for(let i=0;i<n;i++)o[i]=a[i]?0:1;
    return o
  };
  // blur the blocky grid and keep where it is more than half wall: outer corners round off (a lone tree becomes a disc),
  // inner corners fill in, and stepped edges become smooth slopes. Gaps of a tile or more (paths, doors) stay open,
  // because in the middle of a 1-tile gap less than a sixth of the blur is wall.
  const sig=SMOOTH*RES,rad=Math.ceil(sig*3),ker=new Float32Array(2*rad+1);
  let ks=0;
  for(let i=-rad;i<=rad;i++)ks+=ker[i+rad]=Math.exp(-i*i/(2*sig*sig));
  for(let i=0;i<ker.length;i++)ker[i]/=ks;
  const tmp=new Float32Array(n),blur=new Float32Array(n);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    let v=0;
    for(let k=-rad;k<=rad;k++){
      const ii=Math.min(w-1,Math.max(0,i+k));
      v+=solid[j*w+ii]*ker[k+rad]
    }
    tmp[j*w+i]=v
  }
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    let v=0;
    for(let k=-rad;k<=rad;k++){
      const jj=Math.min(h-1,Math.max(0,j+k));
      v+=tmp[jj*w+i]*ker[k+rad]
    }
    blur[j*w+i]=v
  }
  const shape=new Uint8Array(n);
  for(let i=0;i<n;i++)shape[i]=blur[i]>.5?1:0;
  // signed distance in tiles: positive in the open, negative inside walls
  const dOut=edt(shape,w,h),dIn=edt(inv(shape),w,h),d=new Float32Array(n);
  for(let i=0;i<n;i++)d[i]=(shape[i]?-(dIn[i]-.5):(dOut[i]-.5))/RES;
  COL={w,h,d,sig:collisionSig(),reg:placeKey()}
}
function collisionSig(){
  let s=placeKey()+":";
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const c=M[y][x];
    if(SOLID.has(c)&&!SOFT.has(c))s+=x+","+y+";"
  }
  return s.length+":"+hash(s.length,s.charCodeAt(s.length>>1)||0,s.charCodeAt(s.length-2)||0)+":"+s.slice(-64)
}
let colCheck=0;
function ensureCollision(dt){
  // rebuilt when the region changes, and checked twice a second for tiles that quests open or close (gates, the bridge, Nullo)
  colCheck-=dt||0;
  if(!COL||COL.reg!==placeKey()||COL.w!==(W+2)*RES||COL.h!==(H+2)*RES){
    buildCollision();
    colCheck=500;
    return
  }
  if(colCheck<=0||!dt){   // dt 0 = check right now (after code changed a tile)
    colCheck=500;
    if(collisionSig()!==COL.sig)buildCollision()
  }
}
function sdf(x,y){
  // bilinear sample of the field at a point in tiles
  const gx=(x+1)*RES-.5,gy=(y+1)*RES-.5,i=Math.floor(gx),j=Math.floor(gy),fx=gx-i,fy=gy-j,w=COL.w,h=COL.h;
  if(i<0||j<0||i>=w-1||j>=h-1)return -1;
  const d=COL.d,a=d[j*w+i],b=d[j*w+i+1],c=d[(j+1)*w+i],e=d[(j+1)*w+i+1];
  return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+e*fx)*fy
}
function sdfNormal(x,y){
  const e=.5/RES,nx=sdf(x+e,y)-sdf(x-e,y),ny=sdf(x,y+e)-sdf(x,y-e),l=Math.hypot(nx,ny)||1;
  return [nx/l,ny/l]
}
const walkable=(x,y,r)=>sdf(x,y)>=r;
// push a circle out of walls and round bodies; cancel the part of its velocity that points into what it hit (so it slides)
function resolve(o,r,bodies){
  for(let it=0;it<4;it++){
    const d=sdf(o.x,o.y);
    if(d>=r)break;
    const [nx,ny]=sdfNormal(o.x,o.y),push=r-d;
    o.x+=nx*push;
    o.y+=ny*push;
    const vn=o.vx*nx+o.vy*ny;
    if(vn<0){
      o.vx-=vn*nx;
      o.vy-=vn*ny
    }
  }
  for(const b of bodies){
    if(b===o)continue;
    const dx=o.x-b.x,dy=o.y-b.y,rr=r+b.r,d2=dx*dx+dy*dy;
    if(d2>=rr*rr)continue;
    const d=Math.sqrt(d2)||1e-4,nx=d2?dx/d:1,ny=d2?dy/d:0,push=rr-d;
    o.x+=nx*push;
    o.y+=ny*push;
    const vn=o.vx*nx+o.vy*ny;
    if(vn<0){
      o.vx-=vn*nx;
      o.vy-=vn*ny
    }
  }
}
// ---------- NPCs (the Prof, Mom): round bodies that turn to look at you; Mom potters about the house ----------
// x, y: collision centre in tiles (the feet are PHYS.feet lower). wander: how far from home they stroll (0 = stays put).
const NPC_DEFS={
  "0:home-down":[{id:"mom",kind:"villager",look:2,x:6.5,y:5.6,wander:1.1,speed:1.2,tag:"MOM"}],
  "0:cottage":[{id:"cottager",kind:"villager",look:0,x:5.5,y:3.62,wander:.9,speed:1,tag:"COTTAGER",
   line:"COTTAGER: Oh, a visitor! Sit, sit. My kettle's code says 'boil until done', and it's been boiling since Tuesday. Bugs everywhere these days."}],
  1:[{id:"prof",kind:"prof",x:4.75,y:5.25,wander:0,tag:"PROF. SEMICOLON"}],   // the village people walk their own routes (life.js)
  2:[]};
const NPCS={};
const placeKey=()=>REG===0?"0:"+ROOM:REG;   // each interior room has its own people and its own collision field
function npcsHere(){
  const key=placeKey();
  if(!NPCS[key])NPCS[key]=(NPC_DEFS[key]||[]).map(d=>({...d,home:[d.x,d.y],vx:0,vy:0,r:.3,dir:d.dir==null?2:d.dir,moving:false,state:"idle",timer:500+Math.random()*2500,tx:d.x,ty:d.y,stuck:0,look:d.look||0,solid:d.solid!==false,talk:d.talk!==false}));
  return NPCS[key]
}
const dirTo=(dx,dy)=>Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
function pickWanderTarget(n){
  for(let k=0;k<10;k++){
    const a=Math.random()*Math.PI*2,r=.6+Math.random()*n.wander,tx=n.home[0]+Math.cos(a)*r,ty=n.home[1]+Math.sin(a)*r;
    if(!walkable(tx,ty,n.r+.12))continue;
    // the straight walk there must be clear too
    let ok=true;
    const L=Math.hypot(tx-n.x,ty-n.y);
    for(let s=.25;s<L;s+=.25)if(!walkable(n.x+(tx-n.x)*s/L,n.y+(ty-n.y)*s/L,n.r+.04)){
      ok=false;
      break
    }
    if(ok)return [tx,ty]
  }
  return null
}
// everything the player bumps into besides walls: the NPCs above and the walking villagers (life.js keeps their feet at p.y)
function solidBodies(){
  const b=npcsHere().filter(n=>n.solid);
  if(REG===1&&typeof LIFE!=="undefined")for(const p of LIFE.people)b.push({x:p.x,y:p.y-PHYS.feet,r:.3});
  return b
}
function updateNPCs(dt){
  const list=npcsHere(),s=dt/1000,me={x:P.px,y:P.py,r:PHYS.radius};
  for(const n of list){
    const dxp=P.px-n.x,dyp=P.py-n.y,dp=Math.hypot(dxp,dyp);
    if(n.talking){
      // the one you're talking to stops and looks at you
      n.vx=n.vy=0;
      n.moving=false;
      n.dir=dirTo(dxp,dyp);
      continue
    }
    n.timer-=dt;
    if(!n.wander){
      // people who stay put still glance around, and turn to you when you come close
      if(dp<2.4&&mode==="walk")n.dir=dirTo(dxp,dyp);
      else if(n.timer<=0){
        n.dir=[2,1,3,2,0][Math.floor(Math.random()*5)];
        n.timer=1800+Math.random()*3500
      }
      continue
    }
    if(n.state==="idle"){
      if(dp<1.8&&mode==="walk")n.dir=dirTo(dxp,dyp);
      if(n.timer<=0){
        const t=pickWanderTarget(n);
        if(t){
          [n.tx,n.ty]=t;
          n.state="walk";
          n.stuck=0;
          n.timer=6000
        }else n.timer=800+Math.random()*1500
      }
    }
    // if you walk straight at a villager, they make way instead of blocking the path
    if(dp<1.15&&Math.hypot(P.vx,P.vy)>1&&(P.vx*-dxp+P.vy*-dyp)>0&&n.state!=="dodge"){
      const away=[n.x-dxp*.9+dyp*.6,n.y-dyp*.9-dxp*.6];
      if(walkable(away[0],away[1],n.r+.08)){
        [n.tx,n.ty]=away;
        n.state="dodge";
        n.timer=1200
      }
    }
    let ax=0,ay=0;
    if(n.state==="walk"||n.state==="dodge"){
      const dx=n.tx-n.x,dy=n.ty-n.y,d=Math.hypot(dx,dy),sp=n.state==="dodge"?n.speed*1.6:n.speed;
      if(d<.08||n.timer<=0){
        n.state="idle";
        n.timer=1200+Math.random()*3500
      }else{
        const want=Math.min(sp,d*4);   // ease in to the stop
        ax=dx/d*want-n.vx;
        ay=dy/d*want-n.vy
      }
    }else{
      ax=-n.vx;
      ay=-n.vy
    }
    const k=Math.min(1,s*10);
    n.vx+=ax*k;
    n.vy+=ay*k;
    const ox=n.x,oy=n.y;
    n.x+=n.vx*s;
    n.y+=n.vy*s;
    resolve(n,n.r,[me,...list.filter(b=>b.solid&&b!==n)]);
    const moved=Math.hypot(n.x-ox,n.y-oy);
    n.moving=moved>s*.35;
    if(n.moving)n.dir=dirTo(n.vx,n.vy);
    // stuck against something: give up on this walk
    if((n.state==="walk"||n.state==="dodge")&&moved<s*.2){
      n.stuck+=dt;
      if(n.stuck>450){
        n.state="idle";
        n.timer=600+Math.random()*1200
      }
    }else n.stuck=0
  }
}
function drawNPCs(spr,t,cx,cy){
  for(const n of npcsHere()){
    const feet=n.y+PHYS.feet,o={};
    if(n.tag)o.tag=n.tag;
    if(n.kind==="villager")o.sheet=villagerLook(n.look);
    if(n.id==="prof")o.bang=!S.talked||!S.starter;
    if(n.id==="mom")o.bang=!S.starter&&!S.leftHome;
    spr.push({y:feet*T,f:()=>actor(g,n.kind,(n.x-.5)*T-cx,(n.y-.62)*T-cy,n.dir,n.moving,t,o)})
  }
}
// the person you're facing, close enough to talk to
function npcInFront(){
  const d=DIRS[P.dir];
  let best=null,bd=1e9;
  for(const n of npcsHere()){
    if(!n.talk)continue;
    const dx=n.x-P.px,dy=n.y-P.py,dist=Math.hypot(dx,dy);
    if(dist>1.3)continue;
    const along=(dx*d[0]+dy*d[1])/(dist||1);
    if(along<.55)continue;   // within ~55° of where you face
    if(dist<bd){
      bd=dist;
      best=n
    }
  }
  return best
}
// the tile you're facing: probe a little ahead of your feet until the probe leaves your own tile
function facingTile(){
  const d=DIRS[P.dir];
  let first=null;
  for(const k of [.5,.75,1,1.2]){
    const nx=Math.floor(P.px+d[0]*k),ny=Math.floor(P.py+d[1]*k);
    if(nx===P.x&&ny===P.y)continue;
    const c=(M[ny]||[])[nx];
    const hit={nx,ny,c};
    if(!first)first=hit;
    if(c&&(SOLID.has(c)||"HXxE".includes(c)))return hit
  }
  return first||{nx:P.x+d[0],ny:P.y+d[1],c:(M[P.y+d[1]]||[])[P.x+d[0]]}
}
// ---------- the player ----------
P.px=P.x+.5;
P.py=P.y+.62;
P.vx=0;
P.vy=0;
P.lastSafe=[P.px,P.py];
let physAcc=0;
function inputVector(){
  let ix=(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.a?1:0),iy=(keys.arrowdown||keys.s?1:0)-(keys.arrowup||keys.w?1:0);
  const l=Math.hypot(ix,iy);
  return l?[ix/l,iy/l]:[0,0]
}
function stepPlayer(dt){
  ensureCollision(dt);
  const [ix,iy]=inputVector();
  if(ix||iy){
    // face the way you push; on a diagonal keep facing whichever of the two you already were
    const h=ix>0?1:ix<0?3:-1,v=iy>0?2:iy<0?0:-1;
    if(h<0)P.dir=v;
    else if(v<0)P.dir=h;
    else if(P.dir!==h&&P.dir!==v)P.dir=h
  }
  physAcc+=Math.min(64,dt)/1000;
  const bodies=solidBodies(),me={x:P.px,y:P.py,vx:P.vx,vy:P.vy};
  while(physAcc>=PHYS.step){
    physAcc-=PHYS.step;
    const tvx=ix*PHYS.maxSpeed,tvy=iy*PHYS.maxSpeed,dvx=tvx-me.vx,dvy=tvy-me.vy,dl=Math.hypot(dvx,dvy),
     lim=((ix||iy)&&(dvx*me.vx+dvy*me.vy)>=-1e-6?PHYS.accel:PHYS.decel)*PHYS.step;
    if(dl>lim){
      me.vx+=dvx/dl*lim;
      me.vy+=dvy/dl*lim
    }else{
      me.vx=tvx;
      me.vy=tvy
    }
    me.x+=me.vx*PHYS.step;
    me.y+=me.vy*PHYS.step;
    resolve(me,PHYS.radius,bodies)
  }
  const moved=Math.hypot(me.x-P.px,me.y-P.py);
  P.px=me.x;
  P.py=me.y;
  P.vx=me.vx;
  P.vy=me.vy;
  P.moving=Math.hypot(P.vx,P.vy)>.6;
  if(moved>0)trailPush();
  if(P.moving&&GRASS.has((M[P.y]||[])[P.x]))rustle(dt);
  // crossing into a new tile: doors, region exits, tall grass and saving all happen per tile, as before
  const tx=Math.floor(P.px),ty=Math.floor(P.py);
  if(tx!==P.x||ty!==P.y){
    P.ox=P.x;
    P.oy=P.y;
    P.x=tx;
    P.y=ty;
    P.steps++;
    const c=(M[ty]||[])[tx];
    if(!GRASS.has(c))PUFFS.push({x:P.px*T,y:(P.py+PHYS.feet)*T-2,t:performance.now()});
    if(!GRASS.has(c)&&c!=="H"&&c!=="O")P.lastSafe=[P.px,P.py];
    landed()
  }
}
function haltPlayer(){
  P.vx=P.vy=0;
  P.moving=false;
  physAcc=0
}
// ---------- your partner follows the path you walked, one body-length behind ----------
const TRAIL=[];
function trailReset(x,y){
  TRAIL.length=0;
  TRAIL.push([x,y])
}
function trailPush(){
  const l=TRAIL[TRAIL.length-1];
  if(!l||Math.hypot(P.px-l[0],P.py-l[1])>=.06){
    TRAIL.push([P.px,P.py]);
    if(TRAIL.length>80)TRAIL.shift()
  }
}
function trailPoint(back){
  // the point `back` tiles behind the player, measured along the trail
  let x=P.px,y=P.py,left=back;
  for(let i=TRAIL.length-1;i>=0;i--){
    const [px,py]=TRAIL[i],d=Math.hypot(x-px,y-py);
    if(d>=left){
      const k=left/d;
      return [x+(px-x)*k,y+(py-y)*k]
    }
    left-=d;
    x=px;
    y=py
  }
  return [x,y]
}
// ---------- rustling: leaves fly up as you push through tall grass ----------
const LEAVES=[];
let rustleT=0;
function rustle(dt){
  rustleT-=dt;
  if(rustleT>0||REDUCE)return;
  rustleT=70;
  for(let i=0;i<2;i++)LEAVES.push({x:P.px*T+(Math.random()-.5)*14,y:(P.py+PHYS.feet)*T-6,vx:(Math.random()-.5)*40-P.vx*4,vy:-50-Math.random()*40,t:performance.now(),c:Math.random()<.5?"#7ccf5a":"#4f9f3c"})
}
function drawLeaves(c,cx,cy){
  const now=performance.now();
  for(let i=LEAVES.length-1;i>=0;i--){
    const l=LEAVES[i],a=(now-l.t)/1000;
    if(a>.55){
      LEAVES.splice(i,1);
      continue
    }
    c.globalAlpha=1-a/.55;
    c.fillStyle=l.c;
    c.fillRect(l.x+l.vx*a-cx,l.y+l.vy*a+160*a*a-cy,3,2);
    c.globalAlpha=1
  }
}
// ---------- can you walk from one tile to another? (flood fill over the field; used by the integration tests) ----------
function reachable(from,to,r=PHYS.radius){
  ensureCollision(0);
  const step=1/RES,w=W*RES,h=H*RES,seen=new Uint8Array(w*h),q=[];
  const id=(x,y)=>{
    const i=Math.floor(x*RES),j=Math.floor(y*RES);
    return i<0||j<0||i>=w||j>=h?-1:j*w+i
  };
  const s=id(from[0]+.5,from[1]+.62);
  if(s<0)return false;
  seen[s]=1;
  q.push(s);
  for(let qi=0;qi<q.length;qi++){
    const c=q[qi],ci=c%w,cj=(c-ci)/w;
    if(Math.floor(ci/RES)===to[0]&&Math.floor(cj/RES)===to[1])return true;
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const ni=ci+di,nj=cj+dj;
      if(ni<0||nj<0||ni>=w||nj>=h)continue;
      const n=nj*w+ni;
      if(seen[n])continue;
      seen[n]=1;
      if(sdf((ni+.5)*step,(nj+.5)*step)>=r)q.push(n)
    }
  }
  return false
}
