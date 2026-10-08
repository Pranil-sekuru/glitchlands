// meadow.js: Region 1 (Meadow Mainframe): ground baking and world drawing
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- Region 1: the Meadow Mainframe, drawn from assets/meadow ----------
// env sheet (4x4): 0 oak, 1 birch, 2 pine, 3 flower bush, 4 rocks, 5 log, 6 stump, 7 fern, 8 flowers, 9 wheat grass, 10 cattails, 11 lily pads, 12 sign, 13 chest, 14 chest open, 15 fence
// sys sheet (4x4): 0 lab, 1 cottage, 2/3 lantern broken/fixed, 4/5 pump, 6/7 bell, 8/9 gate closed/open, 10/11 compiler, 12 crates, 13 barrel, 14 bench, 15 flower garden
const MAP1=document.createElement("canvas");
MAP1.width=REG1.W*64;
MAP1.height=REG1.H*64;
// static scenery: [sheet, index, centre x (tiles), base row (tiles), width (tiles)]
const MDECOR=[["sys",0,3.5,5,4.4],["sys",1,12,4,3.6],["sys",14,9,2,2],["env",4,11.5,6,1.5],["sys",12,10,11,2.3],["sys",15,3,11,2.6],["env",12,8.5,7,1.2],
 ["env",10,17.6,13.4,1.2],["env",10,22,15.4,1.2],["env",11,19.5,14.6,1.5],["env",3,15.5,12,1.4],["env",7,16,17,1.3],["env",5,24,10,1.8],["env",6,17,6,1.2],["env",3,22.5,19,1.5]];
for(let y=4;y<=12;y++)if(y!==8)MDECOR.push(["env",15,28.5,y,1.35]);   // the east fence
const MTREES=[];
(function(){
  const m=REG1.M,walk=(x,y)=>{
    const c=(m[y]||[])[x];
    return c!==undefined&&c!=="T"&&c!=="~"
  },keep=[[27,6,31,10],[5,19,7,23]];
  for(let y=0;y<REG1.H;y++)for(let x=0;x<REG1.W;x++)if(m[y][x]==="T"){
    const edge=walk(x-1,y)||walk(x+1,y)||walk(x,y-1)||walk(x,y+1)||walk(x-1,y+1)||walk(x+1,y+1)||walk(x,y+2);
    if(keep.some(k=>x>=k[0]&&x<=k[2]&&y>=k[1]&&y<=k[3]))continue;
    if(hash(x,y,501)>(edge?.9:.38))continue;
    const h=hash(x,y,502),kind=h<.45?0:(h<.72?1:2);
    MTREES.push({i:kind,cx:x+.5+(hash(x,y,503)-.5)*.7,by:y+(hash(x,y,504)-.2)*.6,w:(kind===2?2.1:2.5)+hash(x,y,505)*.5})
  }
  MTREES.sort((a,b)=>a.by-b.by)
})();
function buildMeadow(){
  if(!MI.terrain)return;
  const m=REG1.M,w=REG1.W,h=REG1.H,c=MAP1.getContext("2d"),q=S.q;
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality="high";
  const at=(x,y)=>(m[y]||[])[x],tx=(r,cc,X,Y,rot,flip,inset)=>tex(c,r,cc,X,Y,rot,flip,inset,64,MI.terrain);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const ch=m[y][x],X=x*64,Y=y*64,a=hash(x,y,1),b=hash(x,y,2),rot=(a*4)|0,flip=b<.5;
    if(ch==="T"){
      tx(0,5,X,Y,rot,flip);
      c.fillStyle="rgba(4,26,12,.45)";
      c.fillRect(X,Y,64,64)
    }
    else if(!(ch==="h"||(x>=2&&x<=12&&y>=2&&y<=11&&!"gf~".includes(ch))))tex(c,0,5,X-5,Y-5,rot,flip,3,74,MI.terrain);   // wild tall grass (the pond is cut out of it below); tiles overlap so the seams do not show
    else tex(c,0,b<.12?0:7,X-5,Y-5,rot,flip,3,74,MI.terrain);                      // the lighter, safe village lawn
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(at(x,y)==="f"){
    const r=MR.env[8],k=44/r[2];
    c.drawImage(MI.env,r[0],r[1],r[2],r[3],x*64+10+hash(x,y,7)*10,y*64+8+hash(x,y,8)*14,44,r[3]*k)
  }
  // the pond: a shoreline rim, then the pack's water texture through the same jagged mask
  {const wet=(x,y)=>at(x,y)==="~",mk=jaggedMask(wet,w,h);
  rimAround(c,mk,"#5fa83a","#1f5f3a");
  fillMasked(c,mk,lc=>{
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(wet(x,y))tex(lc,4,hash(x,y,3)<.2?0:2,x*64-1,y*64-1,(hash(x,y,6)*4)|0,hash(x,y,9)<.5,1,66,MI.terrain)
  });
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(wet(x,y)&&wet(x-1,y)&&wet(x+1,y)&&wet(x,y-1)&&wet(x,y+1)&&hash(x,y,4)<.45)tex(c,4,7,x*64,y*64,0,false,2,64,MI.terrain);
  mk.width=1}
  // dirt roads: the pack's cobbled dirt through a jagged mask with a bushy grass rim
  {const isP=(x,y)=>PATHS.has(at(x,y)),mk=jaggedMask(isP,w,h);
  rimAround(c,mk,"#6bb23c","#2a6a2a");
  const D=[[362,334],[362,508]];   // two crops of the straight vertical dirt strips (plain, and with pebbles)
  fillMasked(c,mk,lc=>{
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(isP(x,y)){
      const s=D[hash(x,y,5)<.3?1:0];
      const fx=hash(x,y,6)<.5,fy=hash(x,y,9)<.5;
      lc.save();
      lc.translate(x*64+32,y*64+32);
      lc.scale(fx?-1:1,fy?-1:1);
      lc.drawImage(MI.terrain,s[0],s[1],50,50,-33,-33,66,66);
      lc.restore()
    }
  });
  mk.width=1}
  // once the village is restored, flowers bloom across the lawn
  if(q.done)for(let y=2;y<=11;y++)for(let x=2;x<=12;x++)if(at(x,y)==="h"&&hash(x,y,77)<.5){
    const r=MR.env[8],k=34/r[2];
    c.drawImage(MI.env,r[0],r[1],r[2],r[3],x*64+hash(x,y,78)*30,y*64+hash(x,y,79)*30,34,r[3]*k)
  }
}
const MSYS={lamp:[2,3,4.5,7,1.7],pump:[4,5,12.5,9,2.6],bell:[6,7,9.5,5,2.5]};   // [broken, fixed, centre x, base row, width]
function drawMeadowWorld(t,dt,cx,cy,VWp,VHp,fpx,fpy){
  if(!artReady||!MI.env||!MI.sys||!MI.terrain)return;
  g.imageSmoothingEnabled=true;
  g.imageSmoothingQuality="high";
  g.drawImage(MAP1,-cx,-cy,REG1.W*T,REG1.H*T);
  const bmv=followByte(dt),q=S.q,spr=[],now=performance.now();
  drawPuffs(g,cx,cy);
  const pbox=[fpx-cx-14,fpy-cy-48,28,52];   // where the player stands on screen (for see-through crowns)
  const put=(sheet,i,cxT,byT,wT,alpha)=>{
    const img=MI[sheet],r=MR[sheet][i];
    if(!img)return;
    const dw=wT*T,k=dw/r[2],dh=r[3]*k,dx=cxT*T-dw/2-cx,dy=(byT+1)*T-dh-cy+3;
    if(dx>VWp||dx+dw<0||dy>VHp||dy+dh<0)return;
    const ov=alpha&&!(dx>pbox[0]+pbox[2]||dx+dw<pbox[0]||dy>pbox[1]+pbox[3]||dy+dh<pbox[1]);
    if(ov)g.globalAlpha=.45;
    g.drawImage(img,r[0],r[1],r[2],r[3],dx,dy,dw,dh);
    g.globalAlpha=1
  };
  spr.push({y:fpy+T,f:()=>actor(g,"player",fpx-cx,fpy-cy,P.dir,P.moving,t)});
  spr.push({y:BYT.y*T+T+2,f:()=>byteSprite(g,t,cx,cy,bmv)});
  spr.push({y:6*T+T,f:()=>actor(g,"prof",7*T-cx,6*T-cy,2,false,t,{tag:"PROF. SEMICOLON",bang:!S.talked})});
  spr.push({y:7*T+T,f:()=>actor(g,"villager",10*T-cx,7*T-cy,3,false,t)});
  spr.push({y:7*T+T+1,f:()=>actor(g,"villager",5*T-cx,7*T-cy,1,false,t,{sheet:villager2()})});
  const gateOpen=M[8][28]!=="N";
  if(!gateOpen)spr.push({y:8*T+T+2,f:()=>actor(g,"nullo",28*T-cx,8*T-cy,3,false,t,{tag:"NULLO"})});
  MDECOR.forEach(d=>spr.push({y:(d[3]+1)*T,f:()=>put(d[0],d[1],d[2],d[3],d[4])}));
  spr.push({y:(8+1)*T-4,f:()=>put("sys",gateOpen?9:8,28.5,8,2.6)});
  spr.push({y:(8+1)*T,f:()=>put("sys",q.done?11:10,30.5,8,2.4)});
  SYS.forEach(sy=>{
    const d=MSYS[sy.key],fixed=!!q.fixed[sy.key];
    spr.push({y:(d[3]+1)*T,f:()=>put("sys",fixed?d[1]:d[0],d[2],d[3],d[4])})
  });
  MTREES.forEach(tr=>{
    if((tr.by+1)*T<cy-40||(tr.by-3)*T>cy+VHp)return;
    spr.push({y:(tr.by+1)*T,f:()=>put("env",tr.i,tr.cx,tr.by,tr.w,(tr.by+1)*T>fpy+T)})
  });
  // purple corruption still writhing around what is broken (and over the blocked south road)
  const corr=[];
  SYS.forEach(sy=>{
    if(!q.fixed[sy.key]){
      const d=MSYS[sy.key];
      corr.push([d[2]-.2,d[3]-.2])
    }
  });
  if(!q.done)corr.push([6.5,22.6]);
  corr.forEach((p,j)=>spr.push({y:p[1]*T+T+50,f:()=>{
    const r=MR.fx[3*8+Math.floor(t/120+j*2)%8],s=60/Math.max(r[2],r[3]);
    g.drawImage(MI.fx,r[0],r[1],r[2],r[3],p[0]*T-r[2]*s/2-cx,p[1]*T-r[3]*s/2-cy,r[2]*s,r[3]*s)
  }}));
  if(FX.restore&&now-FX.restore.t0<1200){
    const fr=Math.min(7,Math.floor((now-FX.restore.t0)/140));
    spr.push({y:99999,f:()=>{
      const r=MR.fx[5*8+fr],s=300/Math.max(r[2],r[3]);
      g.drawImage(MI.fx,r[0],r[1],r[2],r[3],7*T-r[2]*s/2-cx,6*T-r[3]*s/2-cy,r[2]*s,r[3]*s)
    }})
  }
  spr.sort((a,b)=>a.y-b.y).forEach(s=>s.f());
  // fireflies drift over the village once it is restored
  if(q.done)for(let i=0;i<28;i++){
    const wx=(hash(i,31)*REG1.W*T+Math.sin(t/1400+i*1.9)*20+t*.004*(1+hash(i,3)))%(REG1.W*T),wy=(hash(i,32)*REG1.H*T+Math.cos(t/1100+i*2.3)*14)%(REG1.H*T),sx=wx-cx,sy=wy-cy;
    if(sx<-30||sy<-30||sx>VWp+30||sy>VHp+30)continue;
    const r=MR.fx[Math.floor(t/110+i*3)%8],s=13/Math.max(r[2],r[3]);
    g.globalAlpha=.9;
    g.drawImage(MI.fx,r[0],r[1],r[2],r[3],sx-r[2]*s/2,sy-r[3]*s/2,r[2]*s,r[3]*s);
    g.globalAlpha=1
  }
  if(flash>0&&!REDUCE){
    g.fillStyle=`rgba(255,255,255,${Math.min(1,flash/300)})`;
    g.fillRect(0,0,VWp,VHp)
  }
}
let VIL2=null;
function villager2(){
  return VIL2||(VIL2=recolor("villager2",MI.vil,(h,s,l)=>(h>=80&&h<=150&&s>.25)?[215,s,l*.95]:null))
}   // the second villager wears blue instead of green
