// core.js: Constants, saved game, region maps, input and canvas setup
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
"use strict";
const $=id=>document.getElementById(id);
const DESC={"off-by-one":"counts one too many or too few","wrong-operator":"the wrong symbol (like = vs += or % vs /)","wrong-variable":"uses the wrong name","bad-condition":"the if-test checks the wrong thing","missing-return":"forgets to hand back the answer","infinite-loop":"a loop that never stops","type-mix-up":"mixes numbers and text","scope":"uses a variable where it cannot be seen"};
const SPECIES={"off-by-one":["Offbyonyx","#e0603a","Counts one too few or one too many."],
 "wrong-operator":["Operatoad","#3a9ee0","Swaps + for =, % for /, and thinks it's funny."],
 "wrong-variable":["Varmint","#b05ae0","Grabs the wrong variable from the pantry."],
 "bad-condition":["Condibug","#e0c03a","Guards a door with the wrong rule."],
 "missing-return":["Returnip","#d04a7a","Does all the work, then forgets to hand it over."],
 "infinite-loop":["Loopent","#7ae03a","Runs in circles. It never gets tired."],"type-mix-up":["Mixtype","#3ae0a0","Mixes numbers with text, then wonders why 7 + 2 is 72."],"scope":["Scopeling","#9aa0a6","Hides a variable where nobody can see it."]};
// ---------- bug bank (JavaScript, easy). § marks the buggy line ----------
const catList=()=>REG===2?CATS8:CATS;
const TIER={"Double Trouble":1,"Damage Dealer":1,"Birthday Candles":1,"Pizza Party Problem":1,"The Silent Function":1,"Coin Collector Glitch":1,"Is It Legal to Drive?":1,"Hot or Not":1,"Hello, Nobody":1,"Times Table Twist":3};
// ---------- state ----------
// the save slot can be changed with ?save=name (the integration tests use their own slot)
const SAVE_KEY=new URLSearchParams(location.search).get("save")||"gl1";
let S;
try{
  S=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}")
}catch(e){
  S={}
}
S.tut??=false;
S.q2??={on:false,lantern:false,relay:false,bridge:false,rival:false,chest:false,done:false};
S.region??=1;
S.q??={on:false,fixed:{},nullo:false,done:false};
S.log??=[];
S.sid??=Math.random().toString(36).slice(2,8);
S.dailyDone??="";
S.xp??=0;
S.streak??=0;
S.last??="";
S.dex??={};
S.stats??={};
S.catches??=0;
S.intro??=false;
S.talked??=false;
S.r1done??=false;
const save=()=>{
  try{
    localStorage.setItem(SAVE_KEY,JSON.stringify(S))
  }catch(e){
  }
};
const dayStr=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today=()=>dayStr(new Date());
const yesterday=()=>{
  const d=new Date();
  d.setDate(d.getDate()-1);
  return dayStr(d)
};
// ---------- map ----------
const REDUCE=matchMedia("(prefers-reduced-motion: reduce)").matches;
const T=32;
let W=32,H=24,REG=1;
let M=[];
let seed=7;
const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
(function(){
  for(let y=0;y<H;y++){
    M.push(new Array(W).fill("g"))
  }
  const set=(x,y,c)=>{
    if(M[y]&&M[y][x]!==undefined)M[y][x]=c
  };
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x<2||x>=W-2||y<2||y>=H-2||x>=29)set(x,y,"T");
  // forest clumps (2-3 tiles each so the canopy autotile always has edges and corners)
  for(let tries=0,placed=0;placed<26&&tries<600;tries++){
    const bw=2+Math.floor(rnd()*2),bh=2+Math.floor(rnd()*2),x=2+Math.floor(rnd()*(26-bw)),y=2+Math.floor(rnd()*(H-4-bh));
    if(x<14&&y<13)continue;
    if(x<=7&&x+bw>=5)continue;
    if(y<=9&&y+bh>=7)continue;
    if(x+bw>=24&&y<=13&&y+bh>=3)continue;
    if(x+bw>=16&&x<=23&&y+bh>=11&&y<=18)continue;
    let clash=false;
    for(let j=-1;j<=bh&&!clash;j++)for(let i=-1;i<=bw;i++){
      const tx=x+i,ty=y+j;
      if(tx>=2&&tx<=W-3&&ty>=2&&ty<=H-3&&M[ty][tx]=="T"){
        clash=true;
        break
      }
    }
    if(clash)continue;
    for(let j=0;j<bh;j++)for(let i=0;i<bw;i++)set(x+i,y+j,"T");
    placed++
  }
  for(let x=0;x<=28;x++)set(x,8,".");
  for(let y=0;y<H;y++)set(6,y,".");
  for(let y=2;y<=5;y++)for(let x=2;x<=4;x++)set(x,y,"L");           // the lab hill
  set(7,6,"P");
  set(8,7,"s");
  set(10,7,"V");
  set(5,7,"V");
  for(let y=2;y<=11;y++)for(let x=2;x<=12;x++)if(M[y][x]=="g")M[y][x]="h";   // safe village lawn
  const prop=(x,y,w,h)=>{
    for(let j=0;j<h;j++)for(let i=0;i<w;i++)set(x+i,y+j,"D")
  };   // collision only: the art for these is MDECOR (meadow module)
  prop(11,6,1,1);
  prop(8,2,2,1);
  prop(11,2,2,3);
  prop(9,10,2,2);
  prop(2,10,2,2);
  [[19,13],[20,13],[18,14],[19,14],[20,14],[21,14],[18,15],[19,15],[20,15],[21,15],[19,16],[20,16]].forEach(p=>set(p[0],p[1],"~"));
  for(let y=4;y<=12;y++)set(28,y,"F");
  set(28,8,"N");
  set(29,8,".");
  set(30,8,"C");
  set(4,7,"1");
  set(12,9,"2");
  set(9,5,"3");
  for(let i=0;i<40;i++){
    const x=2+Math.floor(rnd()*26),y=2+Math.floor(rnd()*(H-4));
    if(M[y][x]=="g")set(x,y,"f")
  }
})();
const REG1={M,W:32,H:24};
const SOLID=new Set(["T","~","L","P","s","N","F","V","D","1","2","3","C","x","R","K","G","S","W","B"]);
const GRASS=new Set(["g","f"]);
// ---------- input ----------
let mode="intro";// walk|battle|dialog|dex|end
const keys={};
addEventListener("keydown",e=>{
  if(e.target&&e.target.tagName==="INPUT"){
    if(e.key==="Enter"){
      e.preventDefault();
      runFix()
    }
    return
  }
  const k=e.key.toLowerCase();
  if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();
  if(!e.repeat)onKey(k);
  keys[k]=true
});
addEventListener("keyup",e=>{
  delete keys[e.key.toLowerCase()]
});
// ---------- drawing ----------
const cv=$("cv"),g=cv.getContext("2d");
let SC=1;   // device pixels per world unit: the world is drawn at full screen resolution, so hi-res sprites stay sharp and pixel-art tiles stay crisp
function sizeCanvas(){
  const d=Math.min(3,window.devicePixelRatio||1),zs=Math.max(1,Math.min(5,Math.round(innerWidth/480)));
  SC=zs*d;
  cv.width=Math.round(innerWidth*d);
  cv.height=Math.round(innerHeight*d);
  cv.style.width="100%";
  cv.style.height="100%";
  g.imageSmoothingEnabled=false
}
sizeCanvas();
addEventListener("resize",()=>{
  sizeCanvas();
  if(typeof fitField==="function")fitField()
});
const P={x:7,y:9,dir:2,prog:0,moving:false,nx:0,ny:0,steps:0,walk:0,ox:7,oy:9,wait:0};
const BYT={x:7,y:9};
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
let flash=0;
const hash=(x,y,n=0)=>{
  let h=(Math.imul(x+1,374761393)+Math.imul(y+1,668265263)+Math.imul(n+1,1274126177))|0;
  h=Math.imul(h^(h>>>13),1274126177);
  return((h^(h>>>16))>>>0)/4294967296
};
const PATHS=new Set([".","N","X","C","x"]),WATER=new Set(["~"]);
