// meadow.js: Region 1 (Meadow Mainframe): the painted map, its repairable systems and world drawing
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- Region 1: the Meadow Mainframe, one painted map (assets/meadow/meadow-map.jpg) with the walkable grid from core.js laid over it ----------
// sys sheet (4x4): 0 lab, 1 cottage, 2/3 lantern broken/fixed, 4/5 pump, 6/7 bell, 8/9 gate closed/open, 10/11 compiler, 12 crates, 13 barrel, 14 bench, 15 flower garden
const MAP1=document.createElement("canvas");   // the painting at its own resolution (sized when it loads)
// the painting shows the systems working; while one is broken its broken sprite from the sys sheet covers it: [sheet index, centre x, bottom, width] in tiles
const MSYS={lamp:[2,5.64,10.2,1.55],pump:[4,13.7,14.75,2.8],bell:[6,12.04,6.45,2.7]};
// the professor and villagers are live sprites (npc and villager sheets) standing where the painting had them: [x, feet y] in tiles, facing, look
const PROF_AT=[4.75,5.6];
const VILLAGERS=[[14.74,6.72,2,0],[13.66,7.52,2,1],[15.8,7.52,3,2],[12.22,14.84,1,1]];
const COMPILER_AREA=[23,0,9,9];          // tiles [x, y, w, h]: the Compiler and the north-east trail, purple until it is repaired
function buildMeadow(){
  if(!MI.map)return;
  const c=MAP1.getContext("2d"),q=S.q;
  MAP1.width=MI.map.width;
  MAP1.height=MI.map.height;
  c.drawImage(MI.map,0,0);
  if(!q.done)return;
  // the Compiler is repaired: the purple corruption around it turns back into warm brass
  const fixed=recolor("meadow:restored",MI.map,(h,s,l)=>s>.28&&h>=255&&h<=325?[40,Math.min(.85,s),Math.min(.78,l*1.08)]:null),
   px=MI.map.width/REG1.W,[ax,ay,aw,ah]=COMPILER_AREA;
  c.drawImage(fixed,ax*px,ay*px,aw*px,ah*px,ax*px,ay*px,aw*px,ah*px);
  // and flowers bloom across the village lawn
  const r=MR.env[8];
  for(let y=0;y<REG1.H;y++)for(let x=0;x<REG1.W;x++)if(REG1.M[y][x]==="h"&&hash(x,y,77)<.5){
    const w=24,h=r[3]*w/r[2];
    c.drawImage(MI.env,r[0],r[1],r[2],r[3],(x+hash(x,y,78)*.45)*px,(y+hash(x,y,79)*.45)*px,w,h)
  }
}
function drawMeadowWorld(t,dt,cx,cy,VWp,VHp,fpx,fpy){
  if(!artReady||!MI.map||!MI.sys)return;
  g.imageSmoothingEnabled=true;
  g.imageSmoothingQuality="high";
  g.drawImage(MAP1,-cx,-cy,REG1.W*T,REG1.H*T);
  const bmv=followByte(dt),q=S.q,spr=[],now=performance.now();
  drawPuffs(g,cx,cy);
  const put=(i,cxT,botT,wT)=>{
    const r=MR.sys[i],dw=wT*T,dh=r[3]*dw/r[2];
    g.drawImage(MI.sys,r[0],r[1],r[2],r[3],cxT*T-dw/2-cx,botT*T-dh-cy,dw,dh)
  };
  spr.push({y:fpy+T,f:()=>actor(g,"player",fpx-cx,fpy-cy,P.dir,P.moving,t)});
  spr.push({y:BYT.y*T+T+2,f:()=>byteSprite(g,t,cx,cy,bmv)});
  const[nx,ny]=R1.nullo;
  if(M[ny][nx]==="N")spr.push({y:ny*T+T+2,f:()=>actor(g,"nullo",nx*T-cx,ny*T-cy,2,false,t,{tag:"NULLO"})});
  SYS.forEach(sy=>{
    if(q.fixed[sy.key])return;
    const d=MSYS[sy.key];
    spr.push({y:d[2]*T,f:()=>put(d[0],d[1],d[2],d[3])})
  });
  const at=(x,y)=>[x*T-16-cx,y*T-31-cy];   // actor() takes the top-left of a tile; these spots are given by the feet
  spr.push({y:PROF_AT[1]*T,f:()=>actor(g,"prof",...at(PROF_AT[0],PROF_AT[1]),2,false,t,{tag:"PROF. SEMICOLON",bang:!S.talked})});
  VILLAGERS.forEach(v=>spr.push({y:v[1]*T,f:()=>actor(g,"villager",...at(v[0],v[1]),v[2],false,t,{sheet:villagerLook(v[3])})}));
  spr.sort((a,b)=>a.y-b.y).forEach(s=>s.f());
  const px=PROF_AT[0]*T-cx,py=PROF_AT[1]*T-cy;
  // purple corruption still writhing around what is broken (and over the blocked north-east trail)
  const corr=[];
  SYS.forEach(sy=>{
    if(!q.fixed[sy.key]){
      const d=MSYS[sy.key];
      corr.push([d[1],d[2]-1])
    }
  });
  if(!q.done)corr.push([R1.exit[0]+.5,R1.exit[1]+.5]);
  corr.forEach((p,j)=>{
    const r=MR.fx[3*8+Math.floor(t/120+j*2)%8],s=60/Math.max(r[2],r[3]);
    g.drawImage(MI.fx,r[0],r[1],r[2],r[3],p[0]*T-r[2]*s/2-cx,p[1]*T-r[3]*s/2-cy,r[2]*s,r[3]*s)
  });
  if(FX.restore&&now-FX.restore.t0<1200){
    const fr=Math.min(7,Math.floor((now-FX.restore.t0)/140)),r=MR.fx[5*8+fr],s=300/Math.max(r[2],r[3]);
    g.drawImage(MI.fx,r[0],r[1],r[2],r[3],px-r[2]*s/2,py-T-r[3]*s/2,r[2]*s,r[3]*s)
  }
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
const LOOKS=[null,null,null];
function villagerLook(i){
  // 0 the sheet as drawn (green), 1 blue, 2 red
  if(!i||!MI.vil)return MI.vil;
  return LOOKS[i]||(LOOKS[i]=recolor("villager"+i,MI.vil,(h,s,l)=>(h>=80&&h<=150&&s>.25)?[i===1?215:355,s,l*.95]:null))
}
