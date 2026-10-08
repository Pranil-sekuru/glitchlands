// actors.js: Actors (player, Byte, NPCs), Bug sprites, Bugdex portraits, dust
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- actors: rows are down, left, right, up; the player and Byte share player-byte.png, the professor and Nullo share npcs.png ----------
const FROW=[3,2,0,1];   // my dir (0 up, 1 right, 2 down, 3 left) -> sheet row offset
const ACT={player:["pb",0,146,46],byte:["pb",4,98,26],prof:["npc",0,131,44],nullo:["npc",4,131,44],villager:["vil",0,255,44]};   // [atlas, first row, source height px, height on screen]
function actor(c,who,x,y,dir,mv,t,o={}){
  const a=ACT[who],img=o.sheet||MI[a[0]],rects=MR[a[0]];
  if(!img)return;
  const cols=a[0]==="vil"?4:8,frame=mv?Math.floor(t/(cols===4?140:85))%cols:0,r=rects[(a[1]+FROW[dir])*cols+frame],k=a[3]/a[2],dw=r[2]*k,dh=r[3]*k;
  const fx=x+16,fy=y+31+(mv?0:Math.sin(t/520)*.5);
  c.fillStyle="rgba(0,0,0,.25)";
  c.beginPath();
  c.ellipse(fx,y+30.5,Math.max(7,dw*.32),3,0,0,7);
  c.fill();
  c.save();
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality="high";
  c.drawImage(img,r[0],r[1],r[2],r[3],fx-dw/2,fy-dh,dw,dh);
  c.restore();
  if(o.tag)nameTag(c,fx,fy-dh-4,o.tag);
  if(o.bang&&MI.fx){
    const r2=MR.fx[7*8+2],s=15/r2[3];
    c.drawImage(MI.fx,r2[0],r2[1],r2[2],r2[3],fx-r2[2]*s/2,fy-dh-20-Math.abs(Math.sin(t/260))*5,r2[2]*s,15)
  }
}
// ---- the forest ranger NPC: the Syntax Forest rival rows (4-7) recoloured by wardenSheet() ----
function actorHi(c,who,x,y,dir,mv,t,o={}){
  const img=o.sheet||FI.npcs;
  if(!img)return;
  const row=(who==="warden"?4:0)+FROW[dir],frame=mv?Math.floor(t/85)%8:0,r=FR.npcs[row*8+frame],k=(o.h||46)/148,dw=r[2]*k,dh=r[3]*k;
  const fx=x+16,fy=y+31+(mv?0:Math.sin(t/520)*.5);
  c.fillStyle="rgba(0,0,0,.25)";
  c.beginPath();
  c.ellipse(fx,y+30.5,Math.max(8,dw*.3),3.2,0,0,7);
  c.fill();
  c.save();
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality="high";
  c.drawImage(img,r[0],r[1],r[2],r[3],fx-dw/2,fy-dh,dw,dh);
  c.restore();
  if(o.tag)nameTag(c,fx,fy-dh-4,o.tag)
}
function nameTag(c,x,y,text){
  c.font="bold 10px 'Courier New'";
  c.textAlign="center";
  c.lineWidth=3;
  c.strokeStyle="#2b2433";
  c.strokeText(text,x,y);
  c.fillStyle="#fff";
  c.fillText(text,x,y)
}
// Byte, the golden beetle: trails the player one step behind
let bDir=2;
function followByte(dt){
  const k=1-Math.exp(-dt/110),bdx=P.ox-BYT.x,bdy=P.oy-BYT.y;
  if(Math.abs(bdx)+Math.abs(bdy)>4){
    BYT.x=P.ox;
    BYT.y=P.oy
  }else{
    BYT.x+=bdx*k;
    BYT.y+=bdy*k
  }
  const mv=Math.abs(bdx)+Math.abs(bdy)>0.06;
  if(mv)bDir=Math.abs(bdx)>Math.abs(bdy)?(bdx>0?1:3):(bdy>0?2:0);
  return mv
}
function byteSprite(c,t,cx,cy,mv){
  actor(c,"byte",Math.round(BYT.x*T)-cx,Math.round(BYT.y*T)-cy,bDir,mv,t);
  c.fillStyle="#fff2a0";
  const x=Math.round(BYT.x*T)-cx,y=Math.round(BYT.y*T)-cy;
  for(let i=0;i<3;i++){
    const a=t/300+i*2.1;
    c.fillRect(x+16+Math.cos(a)*12,y+8+Math.sin(a)*6,2,2)
  }
}
// ---------- Bugs: six Meadow species (idle row + capture-reaction row each) and four Forest species ----------
const MBUGS=[["bugA",0],["bugA",2],["bugA",4],["bugB",0],["bugB",2],["bugB",4]];   // [atlas, idle row]; the reaction row follows it
const MB_BY_CAT={"off-by-one":0,"wrong-operator":1,"wrong-variable":2,"bad-condition":3,"missing-return":4,"infinite-loop":5};
const EPITHETS=["the Sneaky","the Grumpy","the Sleepy","the Mighty","the Tiny","the Jolly","the Dizzy"];
const pick=a=>a[Math.floor(Math.random()*a.length)];
function makeVis(cat,rival){
  // the look is random: it never reveals the bug's type
  const base={rival:!!rival,epi:pick(EPITHETS),shiny:!rival&&Math.random()<(REG===2?.06:.08)};
  if(REG===2)return {...base,forest:true,fr:Math.floor(Math.random()*4),scale:rival?1.12:.9+Math.random()*.2};
  return {...base,mb:rival?3:Math.floor(Math.random()*6),scale:rival?1.15:.88+Math.random()*.26}
}
function bugSprite(c,vis,cx,cy,size,t,o={}){
  if(!artReady||!vis)return;
  if(vis.forest)return forestBug(c,vis,cx,cy,size,t,o);
  const [key,row0]=MBUGS[vis.mb],img=MI[key];
  if(!img)return;
  let row=row0,frame=Math.floor(t/200)%8;
  if(o.hurt!=null){
    row=row0+1;
    frame=Math.min(3,Math.floor(o.hurt/90))
  }
  else if(o.death!=null){
    row=row0+1;
    frame=4+Math.min(3,Math.floor(o.death/115))
  }
  const r=MR[key][row*8+frame],k=size*.62*vis.scale*(o.sc==null?1:o.sc)/130,dw=r[2]*k,dh=r[3]*k;
  c.fillStyle="rgba(0,0,0,.3)";
  c.beginPath();
  c.ellipse(cx,cy+2,Math.max(26,dw*.34),Math.max(7,dh*.07),0,0,7);
  c.fill();
  c.save();
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality="high";
  c.drawImage(img,r[0],r[1],r[2],r[3],cx+(o.dx||0)-dw/2,cy-dh,dw,dh);
  if(vis.rival){
    c.fillStyle="#ffd84a";
    const x=cx-dw*.12,y=cy-dh-dh*.02,u=dw*.05;
    c.beginPath();
    c.moveTo(x,y);
    c.lineTo(x,y-u*3);
    c.lineTo(x+u,y-u*1.6);
    c.lineTo(x+u*2.4,y-u*3.4);
    c.lineTo(x+u*3.8,y-u*1.6);
    c.lineTo(x+u*4.8,y-u*3);
    c.lineTo(x+u*4.8,y);
    c.closePath();
    c.fill()
  }
  if(vis.shiny){
    c.fillStyle="#fff7b0";
    for(let i=0;i<5;i++){
      const a=t/400+i*1.3,q2=Math.max(3,dw/40);
      c.fillRect(cx+Math.cos(a)*dw*.4,cy-dh*.5+Math.sin(a*1.3)*dh*.4,q2,q2)
    }
  }
  c.restore()
}
// ---- Syntax Forest Bugs: beetle, moth, millipede, owl (idle row + capture-reaction row) ----
function forestBug(c,vis,cx,cy,size,t,o){
  if(!FI.bugs)return;
  const idle=vis.fr*2,react=idle+1;
  let row=idle,frame=Math.floor(t/200)%8;
  if(o.hurt!=null){
    row=react;
    frame=Math.min(3,Math.floor(o.hurt/90))
  }
  else if(o.death!=null){
    row=react;
    frame=4+Math.min(3,Math.floor(o.death/115))
  }
  const r=FR.bugs[row*8+frame],k=size*.62*vis.scale*(o.sc==null?1:o.sc)/148,dw=r[2]*k,dh=r[3]*k;
  c.fillStyle="rgba(0,0,0,.3)";
  c.beginPath();
  c.ellipse(cx,cy+2,Math.max(30,dw*.34),Math.max(8,dh*.07),0,0,7);
  c.fill();
  c.save();
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality="high";
  c.drawImage(FI.bugs,r[0],r[1],r[2],r[3],cx+(o.dx||0)-dw/2,cy-dh,dw,dh);
  if(vis.shiny){
    c.fillStyle="#fff7b0";
    for(let i=0;i<5;i++){
      const a=t/400+i*1.3,q2=Math.max(3,dw/40);
      c.fillRect(cx+Math.cos(a)*dw*.4,cy-dh*.5+Math.sin(a*1.3)*dh*.4,q2,q2)
    }
  }
  c.restore()
}
// Bugdex portrait: the species' first idle frame, or a black silhouette until it has been caught
function thumb(cat,known){
  const k="th:"+cat+known;
  if(CC[k])return CC[k];
  if(!artReady)return "";
  let img,r;
  if(cat in MB_BY_CAT){
    const [key,row0]=MBUGS[MB_BY_CAT[cat]];
    img=MI[key];
    r=img&&MR[key][row0*8]
  }
  else{
    img=FI.bugs;
    r=img&&FR.bugs[(cat==="type-mix-up"?1:3)*2*8]
  }   // forest species: moth, owl
  if(!img)return "";
  const o=document.createElement("canvas");
  o.width=o.height=72;
  const c=o.getContext("2d"),s=64/Math.max(r[2],r[3]);
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality="high";
  c.drawImage(img,r[0],r[1],r[2],r[3],36-r[2]*s/2,68-r[3]*s,r[2]*s,r[3]*s);
  if(!known){
    c.globalCompositeOperation="source-in";
    c.fillStyle="#0b1a14";
    c.fillRect(0,0,72,72)
  }
  return CC[k]=o.toDataURL()
}
// footstep dust (the pack's dust row, 8 frames)
const PUFFS=[];
function drawPuffs(c,cx,cy){
  const now=performance.now();
  if(!MI.fx)return;
  for(let i=PUFFS.length-1;i>=0;i--){
    const p=PUFFS[i],a=now-p.t;
    if(a>360){
      PUFFS.splice(i,1);
      continue
    }
    const r=MR.fx[8+Math.min(7,Math.floor(a/360*8))],s=26/r[2];
    c.globalAlpha=.6*(1-a/360);
    c.drawImage(MI.fx,r[0],r[1],r[2],r[3],p.x-cx-13,p.y-cy-r[3]*s+6,26,r[3]*s);
    c.globalAlpha=1
  }
}
function foeFrame(t){
  const cvs=$("fc"),c=cvs.getContext("2d"),d=cvs._d||1,w=cvs.width/d,h=cvs.height/d;
  c.setTransform(d,0,0,d,0,0);
  // the arena is a painted scene with two platforms; positions below are in the image's own 1536x1024 pixels
  const A=REG===2?{img:FI.bg,ex:1080,ey:548,mx:455,my:790}:{img:MI.bg,ex:1075,ey:500,mx:490,my:695},iw=1536,ih=1024;
  let ex,ey,mx,my,ref;   // ref = width of a platform in px: bug and hero sizes scale from it
  if(A.img){
    const k2=Math.max(w/iw,h/ih),ox=(w-iw*k2)/2,oy=(h-ih*k2)/2;
    c.imageSmoothingEnabled=true;
    c.imageSmoothingQuality="high";
    c.drawImage(A.img,ox,oy,iw*k2,ih*k2);
    ex=ox+A.ex*k2;
    ey=oy+A.ey*k2;
    mx=ox+A.mx*k2;
    my=oy+A.my*k2;
    ref=560*k2
  }
  else{
    c.fillStyle="#173a29";
    c.fillRect(0,0,w,h);
    const m=Math.min(w,h);
    ex=w*.66;
    ey=h*.6;
    mx=w*.27;
    my=h*.9;
    ref=m*.68
  }
  const m=Math.min(w,h),now=performance.now(),o={};
  if(bs.shake&&now-bs.shake<340){
    o.hurt=now-bs.shake;
    o.dx=(Math.random()-.5)*m*.03
  }
  if(bs.caughtAt){
    const k=now-bs.caughtAt;
    if(k<=900)o.death=k
  }
  if(!(bs.caughtAt&&now-bs.caughtAt>900))bugSprite(c,bs.vis,ex,ey,ref*.76,t,o);
  const atk=bs.atkAt&&now-bs.atkAt<340,hh=ref*.33;
  c.fillStyle="rgba(0,0,0,.3)";
  c.beginPath();
  c.ellipse(mx,my,ref*.2,ref*.058,0,0,7);
  c.fill();
  if(MI.pb){
    const r=MR.pb[3*8],k=hh/r[3],lunge=atk?Math.sin(Math.min(1,(now-bs.atkAt)/340)*Math.PI)*ref*.07:0;   // back view; a quick lunge when you land a hit
    c.imageSmoothingEnabled=true;
    c.imageSmoothingQuality="high";
    c.drawImage(MI.pb,r[0],r[1],r[2],r[3],mx-r[2]*k/2+lunge*.5,my-r[3]*k-lunge,r[2]*k,r[3]*k)
  }
  // your hearts, floating right above your Debugger (icons from the meadow effects sheet)
  if(!bs.tut&&MI.fx){
    const hf=MR.fx[7*8],he=MR.fx[7*8+1],fs=Math.round(ref/8),hw=fs*hf[2]/hf[3],gap=hw*1.05,hx0=mx-(bs.max*gap)/2+(gap-hw)/2,hy0=my-hh-fs*1.25;
    c.imageSmoothingEnabled=true;
    c.imageSmoothingQuality="high";
    for(let i=0;i<bs.max;i++){
      const r=i<bs.lives?hf:he;
      c.drawImage(MI.fx,r[0],r[1],r[2],r[3],hx0+i*gap,hy0,hw,fs)
    }
  }
}
function draw(t,dt){
  const ox=P.moving?DIRS[P.dir][0]*P.prog*T:0,oy=P.moving?DIRS[P.dir][1]*P.prog*T:0;
  g.setTransform(SC,0,0,SC,0,0);
  g.imageSmoothingEnabled=false;
  const VWp=cv.width/SC,VHp=cv.height/SC,snap=v=>Math.round(v*SC)/SC,fpx=P.x*T+ox,fpy=P.y*T+oy;
  const cx=snap(W*T<=VWp?-(VWp-W*T)/2:Math.max(0,Math.min(W*T-VWp,fpx-VWp/2+16))),cy=snap(H*T<=VHp?-(VHp-H*T)/2:Math.max(0,Math.min(H*T-VHp,fpy-VHp/2+16)));
  g.fillStyle="#0b1a14";
  g.fillRect(0,0,VWp,VHp);
  (REG===2?drawForestWorld:drawMeadowWorld)(t,dt,cx,cy,VWp,VHp,fpx,fpy);
}
