"use strict";
// Everything on this page is drawn from the same sprite sheets the game uses.
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
// ---- animated pixel logo: 5x7 bitmap font, letters drop and bounce in, then wave; CRT glitch bursts with an RGB split ----
(function logo(){
  const F={G:[".###.","#...#","#....","#.###","#...#","#...#",".###."],L:["#....","#....","#....","#....","#....","#....","#####"],
  I:["#####","..#..","..#..","..#..","..#..","..#..","#####"],T:["#####","..#..","..#..","..#..","..#..","..#..","..#.."],
  C:[".###.","#...#","#....","#....","#....","#...#",".###."],H:["#...#","#...#","#...#","#####","#...#","#...#","#...#"],
  A:[".###.","#...#","#...#","#####","#...#","#...#","#...#"],N:["#...#","##..#","#.#.#","#.#.#","#..##","#...#","#...#"],
  D:["####.","#...#","#...#","#...#","#...#","#...#","####."],S:[".####","#....","#....",".###.","....#","....#","####."]};
  const word="GLITCHLANDS",LW=5,LH=7,GAP=2,PAD=4,HEAD=8;
  const LOGW=word.length*(LW+GAP)-GAP+PAD*2,LOGH=LH+PAD*2+HEAD;
  const cv=document.getElementById("logo"),c=cv.getContext("2d");
  const off=document.createElement("canvas");
  off.width=LOGW;
  off.height=LOGH;
  const o=off.getContext("2d");
  const tint=document.createElement("canvas");
  tint.width=LOGW;
  tint.height=LOGH;
  const tc=tint.getContext("2d");
  let S=4;
  function fit(){
    S=Math.max(2,Math.min(11,Math.floor(Math.min(innerWidth-32,1000)/LOGW),Math.floor(innerHeight*.24/LOGH)));
    cv.width=LOGW*S;
    cv.height=LOGH*S;
    c.imageSmoothingEnabled=false
  }
  fit();
  addEventListener("resize",fit);
  const start=performance.now();
  function yOff(i,t){
    const d=t-500-i*120;
    if(d<0)return -(HEAD+LH+6);
    if(d<480){
      const p=d/480;
      return -Math.round((1-p*p)*(HEAD+6))
    }
    const b=d-480;
    if(b<170)return -Math.round(Math.sin(b/170*Math.PI)*3);
    if(b<290)return -Math.round(Math.sin((b-170)/120*Math.PI)*1);
    return reduce?0:Math.round(Math.sin(t/330+i*.6)*1.2)
  }
  function paint(t){
    o.clearRect(0,0,LOGW,LOGH);
    for(let i=0;i<word.length;i++){
      const g=F[word[i]],x0=PAD+i*(LW+GAP),y0=PAD+HEAD+yOff(i,t);
      const lit=(x,y)=>y>=0&&y<LH&&x>=0&&x<LW&&g[y][x]=="#";
      for(let k=2;k>=1;k--){
        o.fillStyle=k==2?"#2b2433":"#b8821f";
        for(let y=0;y<LH;y++)for(let x=0;x<LW;x++)if(lit(x,y))o.fillRect(x0+x+k,y0+y+k,1,1)
      }
      for(let y=0;y<LH;y++)for(let x=0;x<LW;x++)if(lit(x,y)){
        o.fillStyle=!lit(x,y-1)||!lit(x-1,y)?"#fff3a8":"#ffd84a";
        o.fillRect(x0+x,y0+y,1,1)
      }
    }
  }
  let gUntil=0,gNext=2600,bands=[];
  function frame(now){
    const t=now-start;
    paint(t);
    c.clearRect(0,0,cv.width,cv.height);
    if(!reduce&&t>gNext&&t>gUntil){
      gUntil=t+260;
      gNext=t+2600+Math.random()*2800;
      bands=[];
      for(let y=0;y<LOGH;y+=2)bands.push(Math.random()<.4?(Math.random()<.5?-1:1)*(1+(Math.random()*3|0)):0)
    }
    if(!reduce&&t<gUntil){
      [["#ff2a5a",-1],["#27e0ff",1]].forEach(([col,dx])=>{
        tc.clearRect(0,0,LOGW,LOGH);
        tc.globalCompositeOperation="source-over";
        tc.drawImage(off,0,0);
        tc.globalCompositeOperation="source-in";
        tc.fillStyle=col;
        tc.fillRect(0,0,LOGW,LOGH);
        c.globalAlpha=.55;
        c.drawImage(tint,0,0,LOGW,LOGH,dx*S,0,LOGW*S,LOGH*S);
        c.globalAlpha=1
      });
      for(let y=0,b=0;y<LOGH;y+=2,b++)c.drawImage(off,0,y,LOGW,2,bands[b]*S,y*S,LOGW*S,2*S);
    }else c.drawImage(off,0,0,LOGW,LOGH,0,0,LOGW*S,LOGH*S);
    requestAnimationFrame(frame)
  }
  if(reduce){
    paint(99999);
    c.drawImage(off,0,0,LOGW,LOGH,0,0,LOGW*S,LOGH*S)
  }else requestAnimationFrame(frame);
})();
const IM={};
let loaded=0;
const FILES={bg:"battle-background.jpg",pb:"player-byte.png",bugA:"bugs-a.png",bugB:"bugs-b.png"};
Object.keys(FILES).forEach(k=>{
  const i=new Image();
  i.onload=()=>{
    IM[k]=i;
    if(++loaded==4)start()
  };
  i.src="assets/meadow/"+FILES[k]
});
const how=document.getElementById("how"),openHow=()=>{
  how.hidden=false;
  document.getElementById("howclose").focus()
},closeHow=()=>{
  how.hidden=true;
  document.getElementById("howbtn").focus()
};
document.getElementById("howbtn").addEventListener("click",openHow);
document.getElementById("howclose").addEventListener("click",closeHow);
how.addEventListener("click",e=>{
  if(e.target===how)closeHow()
});
document.addEventListener("keydown",e=>{
  if(e.key=="Escape"&&!how.hidden){
    closeHow();
    return
  }
  if(e.key=="Enter"&&how.hidden&&!e.target.closest("a,button")){
    location.href="game.html"
  }
});
// Backdrop = the Meadow Mainframe arena art, the Debugger and Byte patrolling the clearing, wild bugs idling in the grass.
function start(){
  const cv=document.getElementById("scene"),c=cv.getContext("2d");
  let W=0,H=0,D=1;
  const bgc=document.createElement("canvas");
  function layout(){
    D=Math.min(devicePixelRatio||1,2);
    W=innerWidth;
    H=innerHeight;
    cv.width=Math.round(W*D);
    cv.height=Math.round(H*D);
    cv.style.width=W+"px";
    cv.style.height=H+"px";
    bgc.width=cv.width;
    bgc.height=cv.height;
    const b=bgc.getContext("2d"),img=IM.bg;
    const k=Math.max(cv.width/img.width,cv.height/img.height),dw=img.width*k,dh=img.height*k;
    b.imageSmoothingQuality="high";
    b.drawImage(img,(cv.width-dw)/2,(cv.height-dh)/2,dw,dh);
    const wash=b.createLinearGradient(0,0,0,cv.height);
    wash.addColorStop(0,"rgba(6,16,12,.72)");
    wash.addColorStop(.5,"rgba(6,16,12,.38)");
    wash.addColorStop(1,"rgba(6,16,12,.12)");
    b.fillStyle=wash;
    b.fillRect(0,0,cv.width,cv.height)
  }
  layout();
  addEventListener("resize",layout);
  function sprite(img,r,cx,base,h){
    const k=h/148,dw=r[2]*k,dh=r[3]*k;
    c.fillStyle="rgba(0,0,0,.3)";
    c.beginPath();
    c.ellipse(cx,base+1,Math.max(10,dw*.32),Math.max(3,dh*.06),0,0,7);
    c.fill();
    c.drawImage(img,r[0],r[1],r[2],r[3],cx-dw/2,base-dh,dw,dh)
  }
  let heroX=-0.1,last=performance.now();
  function frame(t){
    const dt=Math.min(50,t-last);
    last=t;
    c.setTransform(1,0,0,1,0,0);
    c.drawImage(bgc,0,0);
    c.setTransform(D,0,0,D,0,0);
    c.imageSmoothingEnabled=true;
    c.imageSmoothingQuality="high";
    const u=Math.max(70,Math.min(150,H*.16)),road=H*.9;
    [[.1,"bugA",0,.84],[.27,"bugB",2,.93],[.74,"bugA",4,.86],[.9,"bugB",0,.95]].forEach((b,n)=>{
      const f=Math.floor(t/190+n*2)%8;
      sprite(IM[b[1]],MR[b[1]][b[2]*8+f],W*b[0],H*b[3],u*1.1)
    });
    if(!reduce)heroX+=dt*.00006*(1400/Math.max(700,W)+.6);
    if(heroX>1.1)heroX=-0.1;
    const fr=reduce?0:Math.floor(t/85)%8;
    sprite(IM.pb,MR.pb[6*8+fr],W*(heroX-.05),road,u*1.25);   // Byte trails behind
    sprite(IM.pb,MR.pb[2*8+fr],W*heroX,road,u*1.25);          // the Debugger walks right, forever
    if(!reduce)requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame);
}
