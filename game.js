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
let S;try{S=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}")}catch(e){S={}}
S.tut??=false;S.q2??={on:false,lantern:false,relay:false,bridge:false,rival:false,chest:false,done:false};S.region??=1;S.q??={on:false,fixed:{},nullo:false,done:false};S.log??=[];S.sid??=Math.random().toString(36).slice(2,8);S.dailyDone??="";S.xp??=0;S.streak??=0;S.last??="";S.dex??={};S.stats??={};S.catches??=0;S.intro??=false;S.talked??=false;S.r1done??=false;
const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}};
const dayStr=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today=()=>dayStr(new Date());
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return dayStr(d)};
// ---------- map ----------
const REDUCE=matchMedia("(prefers-reduced-motion: reduce)").matches;
const T=32;let W=32,H=24,REG=1;let M=[];
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
(function(){
 for(let y=0;y<H;y++){M.push(new Array(W).fill("g"))}
 const set=(x,y,c)=>{if(M[y]&&M[y][x]!==undefined)M[y][x]=c};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x<2||x>=W-2||y<2||y>=H-2||x>=29)set(x,y,"T");
 // forest clumps (2-3 tiles each so the canopy autotile always has edges and corners)
 for(let tries=0,placed=0;placed<26&&tries<600;tries++){
  const bw=2+Math.floor(rnd()*2),bh=2+Math.floor(rnd()*2),x=2+Math.floor(rnd()*(26-bw)),y=2+Math.floor(rnd()*(H-4-bh));
  if(x<14&&y<13)continue;if(x<=7&&x+bw>=5)continue;if(y<=9&&y+bh>=7)continue;
  if(x+bw>=24&&y<=13&&y+bh>=3)continue;if(x+bw>=16&&x<=23&&y+bh>=11&&y<=18)continue;
  let clash=false;for(let j=-1;j<=bh&&!clash;j++)for(let i=-1;i<=bw;i++){const tx=x+i,ty=y+j;if(tx>=2&&tx<=W-3&&ty>=2&&ty<=H-3&&M[ty][tx]=="T"){clash=true;break}}
  if(clash)continue;
  for(let j=0;j<bh;j++)for(let i=0;i<bw;i++)set(x+i,y+j,"T");placed++}
 for(let x=0;x<=28;x++)set(x,8,".");for(let y=0;y<H;y++)set(6,y,".");
 for(let y=2;y<=5;y++)for(let x=2;x<=4;x++)set(x,y,"L");           // the lab hill
 set(7,6,"P");set(8,7,"s");set(10,7,"V");set(5,7,"V");
 for(let y=2;y<=11;y++)for(let x=2;x<=12;x++)if(M[y][x]=="g")M[y][x]="h";   // safe village lawn
 const prop=(x,y,w,h)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)set(x+i,y+j,"D")};   // collision only: the art for these is MDECOR (meadow module)
 prop(11,6,1,1);prop(8,2,2,1);prop(11,2,2,3);prop(9,10,2,2);prop(2,10,2,2);
 [[19,13],[20,13],[18,14],[19,14],[20,14],[21,14],[18,15],[19,15],[20,15],[21,15],[19,16],[20,16]].forEach(p=>set(p[0],p[1],"~"));
 for(let y=4;y<=12;y++)set(28,y,"F");set(28,8,"N");set(29,8,".");set(30,8,"C");set(4,7,"1");set(12,9,"2");set(9,5,"3");
 for(let i=0;i<40;i++){const x=2+Math.floor(rnd()*26),y=2+Math.floor(rnd()*(H-4));if(M[y][x]=="g")set(x,y,"f")}
})();
const REG1={M,W:32,H:24};
const SOLID=new Set(["T","~","L","P","s","N","F","V","D","1","2","3","C","x","R","K","G","S","W","B"]);
const GRASS=new Set(["g","f"]);
// ---------- input ----------
let mode="intro";// walk|battle|dialog|dex|end
const keys={};
addEventListener("keydown",e=>{
 if(e.target&&e.target.tagName==="INPUT"){if(e.key==="Enter"){e.preventDefault();runFix()}return}
 const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();
 if(!e.repeat)onKey(k);keys[k]=true});
addEventListener("keyup",e=>{delete keys[e.key.toLowerCase()]});
// ---------- drawing ----------
const cv=$("cv"),g=cv.getContext("2d");
let SC=1;   // device pixels per world unit: the world is drawn at full screen resolution, so hi-res sprites stay sharp and pixel-art tiles stay crisp
function sizeCanvas(){const d=Math.min(3,window.devicePixelRatio||1),zs=Math.max(1,Math.min(5,Math.round(innerWidth/480)));SC=zs*d;cv.width=Math.round(innerWidth*d);cv.height=Math.round(innerHeight*d);cv.style.width="100%";cv.style.height="100%";g.imageSmoothingEnabled=false}
sizeCanvas();addEventListener("resize",()=>{sizeCanvas();if(typeof fitField==="function")fitField()});
const P={x:7,y:9,dir:2,prog:0,moving:false,nx:0,ny:0,steps:0,walk:0,ox:7,oy:9,wait:0};
const BYT={x:7,y:9};
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
let flash=0;
const hash=(x,y,n=0)=>{let h=(Math.imul(x+1,374761393)+Math.imul(y+1,668265263)+Math.imul(n+1,1274126177))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
const PATHS=new Set([".","N","X","C","x"]),WATER=new Set(["~"]);
// ---------- the quest: restore three village systems, beat Nullo, repair the Meadow Compiler ----------
const SYS=[
 {key:"lamp",x:4,y:7,bug:"Village Lantern",name:"VILLAGE LANTERN",label:"Glitch in the lantern",
  intro:["The village lantern is spitting corrupted pixels instead of light.","A Bug is hiding in its timer. Find it, then fix it!"],
  after:"The lantern glows warm and steady again. One system is back online!",fixedLine:"The lantern glows steadily. Thanks to you, the village has light again."},
 {key:"pump",x:12,y:9,bug:"Water Pump",name:"WATER PUMP",label:"Glitch in the pump",
  intro:["The water pump coughs and stutters. Its numbers don't add up.","A Bug is hiding in the code that works out the water."],
  after:"Clean water gushes out of the pump. Two systems to go!",fixedLine:"The pump gurgles happily. Clear water, as it should be."},
 {key:"bell",x:9,y:5,bug:"Village Bell",name:"VILLAGE BELL",label:"Glitch in the bell",
  intro:["The village bell is silent, even though its code runs.","A Bug is eating the answer before it can ring."],
  after:"DONG! The bell rings out over the meadow.",fixedLine:"The bell rings out clear and true."}];
const qFixed=()=>SYS.filter(y=>S.q.fixed[y.key]).length;
function questText(){
 if(!S.q.on)return "Talk to Prof. Semicolon";
 if(S.q.done)return "Village restored ✓ (the road south leads to Syntax Forest)";
 const n=qFixed();
 if(n<3)return "Fix the village: "+n+"/3 (lantern, pump, bell)";
 if(!S.q.nullo)return "Out-think Nullo at the east gate";
 return "Repair the Meadow Compiler (east corridor)"}
// ---------- art: two original AI-generated packs (see ASSETS.md); sprite rectangles live in atlas.js ----------
const FOR={terrain:"terrain.jpg",props:"props.png",npcs:"npcs.png",bugs:"bugs.png",effects:"effects.png",bg:"battle-background.jpg"},FI={};   // Syntax Forest (Region 2)
const MEA={terrain:"terrain.jpg",env:"environment.png",sys:"village-systems.png",pb:"player-byte.png",npc:"npcs.png",vil:"villager.png",bugA:"bugs-a.png",bugB:"bugs-b.png",fx:"effects.png",bg:"battle-background.jpg"},MI={};   // Meadow Mainframe (Region 1, player, Byte, Nullo)
let artReady=false;
// Region 1 art loads first so the game starts quickly; Region 2's art streams in behind it.
function loadArt(dir,files,into,then){let n=0;const keys=Object.keys(files),done=()=>{if(++n===keys.length)then()};
 keys.forEach(k=>{const i=new Image();i.onload=()=>{into[k]=i;done()};i.onerror=()=>{console.error("missing art: assets/"+dir+"/"+files[k]);done()};i.src="assets/"+dir+"/"+files[k]})}
loadArt("meadow",MEA,MI,()=>{artReady=true;rebuild();loadArt("forest",FOR,FI,rebuild)});
const CC={};
const TCELL=1254/8;
// one 64 px terrain texture cell (row r, column cc), cropped a few px inside so neighbours never bleed in; optionally rotated / mirrored
function tex(c,r,cc,X,Y,rot,flip,inset,sz,img){
 const i=inset==null?3:inset,x=cc*TCELL+i,y=r*TCELL+i,w=TCELL-2*i,S2=sz||64;
 c.save();c.translate(X+S2/2,Y+S2/2);if(rot)c.rotate(rot*Math.PI/2);if(flip)c.scale(-1,1);c.drawImage(img||FI.terrain,x,y,w,w,-S2/2,-S2/2,S2,S2);c.restore()}
// ---- region shapes (paths, ponds) as a jagged pixel mask, so any width works and edges look hand-pixelled ----
function jaggedMask(isIn,w,h){
 const MK=document.createElement("canvas");MK.width=w*16;MK.height=h*16;const mc=MK.getContext("2d");
 const rr=(col,x,y,sw,sh)=>{if(col==="#000")mc.clearRect(x,y,sw,sh);else{mc.fillStyle="#fff";mc.fillRect(x,y,sw,sh)}};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(isIn(x,y)){
  const X=x*16,Y=y*16,L=!isIn(x-1,y),Rt=!isIn(x+1,y),U=!isIn(x,y-1),D=!isIn(x,y+1);
  rr("#fff",X,Y,16,16);
  for(let i=0;i<16;i++){const j=n=>hash(x*16+i,y*16+i,n)<.3;
   if(U){rr(j(1)?"#000":"#fff",X+i,Y,1,1);if(j(11))rr("#000",X+i,Y+1,1,1)}
   if(D){rr(j(2)?"#000":"#fff",X+i,Y+15,1,1);if(j(12))rr("#000",X+i,Y+14,1,1)}
   if(L){rr(j(3)?"#000":"#fff",X,Y+i,1,1);if(j(13))rr("#000",X+1,Y+i,1,1)}
   if(Rt){rr(j(4)?"#000":"#fff",X+15,Y+i,1,1);if(j(14))rr("#000",X+14,Y+i,1,1)}}
  if(L&&U)rr("#000",X,Y,3,3);if(Rt&&U)rr("#000",X+13,Y,3,3);if(L&&D)rr("#000",X,Y+13,3,3);if(Rt&&D)rr("#000",X+13,Y+13,3,3);
  if(!L&&!U&&!isIn(x-1,y-1))rr("#000",X,Y,2,2);if(!Rt&&!U&&!isIn(x+1,y-1))rr("#000",X+14,Y,2,2);
  if(!L&&!D&&!isIn(x-1,y+1))rr("#000",X,Y+14,2,2);if(!Rt&&!D&&!isIn(x+1,y+1))rr("#000",X+14,Y+14,2,2)}
 const mk=document.createElement("canvas");mk.width=w*64;mk.height=h*64;const kc=mk.getContext("2d");kc.imageSmoothingEnabled=false;kc.drawImage(MK,0,0,w*64,h*64);
 MK.width=1;return mk}
// a bushy rim around the masked shape: a soft outer fringe, then a solid dark inner edge
function rimAround(c,mk,outer,inner){
 const halo=document.createElement("canvas");halo.width=mk.width;halo.height=mk.height;const hc=halo.getContext("2d");hc.drawImage(mk,0,0);hc.globalCompositeOperation="source-in";hc.fillStyle=outer;hc.fillRect(0,0,halo.width,halo.height);
 const ring=(r0,r1,alpha)=>{c.globalAlpha=alpha;for(let r=r0;r<=r1;r+=3)for(let a=0;a<12;a++)c.drawImage(halo,Math.cos(a/12*6.283)*r,Math.sin(a/12*6.283)*r);c.globalAlpha=1};
 ring(9,12,.22);ring(5,8,.5);
 hc.fillStyle=inner;hc.fillRect(0,0,halo.width,halo.height);ring(2,5,1);halo.width=1}
// paint through the mask: paint(ctx) draws on a scratch layer, only the masked part reaches c
function fillMasked(c,mk,paint){const l=document.createElement("canvas");l.width=mk.width;l.height=mk.height;const lc=l.getContext("2d");
 lc.imageSmoothingEnabled=true;lc.imageSmoothingQuality="high";paint(lc);lc.globalCompositeOperation="destination-in";lc.drawImage(mk,0,0);c.drawImage(l,0,0);l.width=1}
// ---- colour work: recolour a sheet by HSL rules (slimes into species colours, the player into NPCs) ----
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;
 if(mx!=mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx==r?(g-b)/d+(g<b?6:0):mx==g?(b-r)/d+2:(r-g)/d+4;h*=60}return[h,s,l]}
function hsl2rgb(h,s,l){h/=360;if(s==0){const v=Math.round(l*255);return[v,v,v]}
 const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p};
 const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return[Math.round(f(p,q,h+1/3)*255),Math.round(f(p,q,h)*255),Math.round(f(p,q,h-1/3)*255)]}
function recolor(key,src,fn){
 if(CC[key])return CC[key];if(!src)return null;
 const c=document.createElement("canvas");c.width=src.width;c.height=src.height;const x=c.getContext("2d");x.drawImage(src,0,0);
 try{const d=x.getImageData(0,0,c.width,c.height),a=d.data;
  for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;const o=fn.apply(null,rgb2hsl(a[i],a[i+1],a[i+2]));if(o){const r=hsl2rgb(o[0],o[1],o[2]);a[i]=r[0];a[i+1]=r[1];a[i+2]=r[2]}}
  x.putImageData(d,0,0)}catch(e){}
 return CC[key]=c}
// ---------- actors: rows are down, left, right, up; the player and Byte share player-byte.png, the professor and Nullo share npcs.png ----------
const FROW=[3,2,0,1];   // my dir (0 up, 1 right, 2 down, 3 left) -> sheet row offset
const ACT={player:["pb",0,146,46],byte:["pb",4,98,26],prof:["npc",0,131,44],nullo:["npc",4,131,44],villager:["vil",0,255,44]};   // [atlas, first row, source height px, height on screen]
function actor(c,who,x,y,dir,mv,t,o={}){
 const a=ACT[who],img=o.sheet||MI[a[0]],rects=MR[a[0]];if(!img)return;
 const cols=a[0]==="vil"?4:8,frame=mv?Math.floor(t/(cols===4?140:85))%cols:0,r=rects[(a[1]+FROW[dir])*cols+frame],k=a[3]/a[2],dw=r[2]*k,dh=r[3]*k;
 const fx=x+16,fy=y+31+(mv?0:Math.sin(t/520)*.5);
 c.fillStyle="rgba(0,0,0,.25)";c.beginPath();c.ellipse(fx,y+30.5,Math.max(7,dw*.32),3,0,0,7);c.fill();
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";c.drawImage(img,r[0],r[1],r[2],r[3],fx-dw/2,fy-dh,dw,dh);c.restore();
 if(o.tag)nameTag(c,fx,fy-dh-4,o.tag);
 if(o.bang&&MI.fx){const r2=MR.fx[7*8+2],s=15/r2[3];c.drawImage(MI.fx,r2[0],r2[1],r2[2],r2[3],fx-r2[2]*s/2,fy-dh-20-Math.abs(Math.sin(t/260))*5,r2[2]*s,15)}}
// ---- the forest ranger NPC: the Syntax Forest rival rows (4-7) recoloured by wardenSheet() ----
function actorHi(c,who,x,y,dir,mv,t,o={}){
 const img=o.sheet||FI.npcs;if(!img)return;
 const row=(who==="warden"?4:0)+FROW[dir],frame=mv?Math.floor(t/85)%8:0,r=FR.npcs[row*8+frame],k=(o.h||46)/148,dw=r[2]*k,dh=r[3]*k;
 const fx=x+16,fy=y+31+(mv?0:Math.sin(t/520)*.5);
 c.fillStyle="rgba(0,0,0,.25)";c.beginPath();c.ellipse(fx,y+30.5,Math.max(8,dw*.3),3.2,0,0,7);c.fill();
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";c.drawImage(img,r[0],r[1],r[2],r[3],fx-dw/2,fy-dh,dw,dh);c.restore();
 if(o.tag)nameTag(c,fx,fy-dh-4,o.tag)}
function nameTag(c,x,y,text){c.font="bold 10px 'Courier New'";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#2b2433";c.strokeText(text,x,y);c.fillStyle="#fff";c.fillText(text,x,y)}
// Byte, the golden beetle: trails the player one step behind
let bDir=2;
function followByte(dt){
 const k=1-Math.exp(-dt/110),bdx=P.ox-BYT.x,bdy=P.oy-BYT.y;
 if(Math.abs(bdx)+Math.abs(bdy)>4){BYT.x=P.ox;BYT.y=P.oy}else{BYT.x+=bdx*k;BYT.y+=bdy*k}
 const mv=Math.abs(bdx)+Math.abs(bdy)>0.06;if(mv)bDir=Math.abs(bdx)>Math.abs(bdy)?(bdx>0?1:3):(bdy>0?2:0);return mv}
function byteSprite(c,t,cx,cy,mv){
 actor(c,"byte",Math.round(BYT.x*T)-cx,Math.round(BYT.y*T)-cy,bDir,mv,t);
 c.fillStyle="#fff2a0";const x=Math.round(BYT.x*T)-cx,y=Math.round(BYT.y*T)-cy;for(let i=0;i<3;i++){const a=t/300+i*2.1;c.fillRect(x+16+Math.cos(a)*12,y+8+Math.sin(a)*6,2,2)}}
// ---------- Bugs: six Meadow species (idle row + capture-reaction row each) and four Forest species ----------
const MBUGS=[["bugA",0],["bugA",2],["bugA",4],["bugB",0],["bugB",2],["bugB",4]];   // [atlas, idle row]; the reaction row follows it
const MB_BY_CAT={"off-by-one":0,"wrong-operator":1,"wrong-variable":2,"bad-condition":3,"missing-return":4,"infinite-loop":5};
const EPITHETS=["the Sneaky","the Grumpy","the Sleepy","the Mighty","the Tiny","the Jolly","the Dizzy"];
const pick=a=>a[Math.floor(Math.random()*a.length)];
function makeVis(cat,rival){   // the look is random: it never reveals the bug's type
 const base={rival:!!rival,epi:pick(EPITHETS),shiny:!rival&&Math.random()<(REG===2?.06:.08)};
 if(REG===2)return {...base,forest:true,fr:Math.floor(Math.random()*4),scale:rival?1.12:.9+Math.random()*.2};
 return {...base,mb:rival?3:Math.floor(Math.random()*6),scale:rival?1.15:.88+Math.random()*.26}}
function bugSprite(c,vis,cx,cy,size,t,o={}){
 if(!artReady||!vis)return;
 if(vis.forest)return forestBug(c,vis,cx,cy,size,t,o);
 const [key,row0]=MBUGS[vis.mb],img=MI[key];if(!img)return;
 let row=row0,frame=Math.floor(t/200)%8;
 if(o.hurt!=null){row=row0+1;frame=Math.min(3,Math.floor(o.hurt/90))}
 else if(o.death!=null){row=row0+1;frame=4+Math.min(3,Math.floor(o.death/115))}
 const r=MR[key][row*8+frame],k=size*.62*vis.scale*(o.sc==null?1:o.sc)/130,dw=r[2]*k,dh=r[3]*k;
 c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(cx,cy+2,Math.max(26,dw*.34),Math.max(7,dh*.07),0,0,7);c.fill();
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 c.drawImage(img,r[0],r[1],r[2],r[3],cx+(o.dx||0)-dw/2,cy-dh,dw,dh);
 if(vis.rival){c.fillStyle="#ffd84a";const x=cx-dw*.12,y=cy-dh-dh*.02,u=dw*.05;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-u*3);c.lineTo(x+u,y-u*1.6);c.lineTo(x+u*2.4,y-u*3.4);c.lineTo(x+u*3.8,y-u*1.6);c.lineTo(x+u*4.8,y-u*3);c.lineTo(x+u*4.8,y);c.closePath();c.fill()}
 if(vis.shiny){c.fillStyle="#fff7b0";for(let i=0;i<5;i++){const a=t/400+i*1.3,q2=Math.max(3,dw/40);c.fillRect(cx+Math.cos(a)*dw*.4,cy-dh*.5+Math.sin(a*1.3)*dh*.4,q2,q2)}}
 c.restore()}
// ---- Syntax Forest Bugs: beetle, moth, millipede, owl (idle row + capture-reaction row) ----
function forestBug(c,vis,cx,cy,size,t,o){
 if(!FI.bugs)return;
 const idle=vis.fr*2,react=idle+1;let row=idle,frame=Math.floor(t/200)%8;
 if(o.hurt!=null){row=react;frame=Math.min(3,Math.floor(o.hurt/90))}
 else if(o.death!=null){row=react;frame=4+Math.min(3,Math.floor(o.death/115))}
 const r=FR.bugs[row*8+frame],k=size*.62*vis.scale*(o.sc==null?1:o.sc)/148,dw=r[2]*k,dh=r[3]*k;
 c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(cx,cy+2,Math.max(30,dw*.34),Math.max(8,dh*.07),0,0,7);c.fill();
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 c.drawImage(FI.bugs,r[0],r[1],r[2],r[3],cx+(o.dx||0)-dw/2,cy-dh,dw,dh);
 if(vis.shiny){c.fillStyle="#fff7b0";for(let i=0;i<5;i++){const a=t/400+i*1.3,q2=Math.max(3,dw/40);c.fillRect(cx+Math.cos(a)*dw*.4,cy-dh*.5+Math.sin(a*1.3)*dh*.4,q2,q2)}}
 c.restore()}
// Bugdex portrait: the species' first idle frame, or a black silhouette until it has been caught
function thumb(cat,known){
 const k="th:"+cat+known;if(CC[k])return CC[k];if(!artReady)return "";
 let img,r;
 if(cat in MB_BY_CAT){const [key,row0]=MBUGS[MB_BY_CAT[cat]];img=MI[key];r=img&&MR[key][row0*8]}
 else{img=FI.bugs;r=img&&FR.bugs[(cat==="type-mix-up"?1:3)*2*8]}   // forest species: moth, owl
 if(!img)return "";
 const o=document.createElement("canvas");o.width=o.height=72;const c=o.getContext("2d"),s=64/Math.max(r[2],r[3]);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";c.drawImage(img,r[0],r[1],r[2],r[3],36-r[2]*s/2,68-r[3]*s,r[2]*s,r[3]*s);
 if(!known){c.globalCompositeOperation="source-in";c.fillStyle="#0b1a14";c.fillRect(0,0,72,72)}
 return CC[k]=o.toDataURL()}
// footstep dust (the pack's dust row, 8 frames)
const PUFFS=[];
function drawPuffs(c,cx,cy){const now=performance.now();if(!MI.fx)return;
 for(let i=PUFFS.length-1;i>=0;i--){const p=PUFFS[i],a=now-p.t;if(a>360){PUFFS.splice(i,1);continue}
  const r=MR.fx[8+Math.min(7,Math.floor(a/360*8))],s=26/r[2];c.globalAlpha=.6*(1-a/360);c.drawImage(MI.fx,r[0],r[1],r[2],r[3],p.x-cx-13,p.y-cy-r[3]*s+6,26,r[3]*s);c.globalAlpha=1}}
function foeFrame(t){
 const cvs=$("fc"),c=cvs.getContext("2d"),d=cvs._d||1,w=cvs.width/d,h=cvs.height/d;c.setTransform(d,0,0,d,0,0);
 // the arena is a painted scene with two platforms; positions below are in the image's own 1536x1024 pixels
 const A=REG===2?{img:FI.bg,ex:1080,ey:548,mx:455,my:790}:{img:MI.bg,ex:1075,ey:500,mx:490,my:695},iw=1536,ih=1024;
 let ex,ey,mx,my,ref;   // ref = width of a platform in px: bug and hero sizes scale from it
 if(A.img){const k2=Math.max(w/iw,h/ih),ox=(w-iw*k2)/2,oy=(h-ih*k2)/2;
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";c.drawImage(A.img,ox,oy,iw*k2,ih*k2);
  ex=ox+A.ex*k2;ey=oy+A.ey*k2;mx=ox+A.mx*k2;my=oy+A.my*k2;ref=560*k2}
 else{c.fillStyle="#173a29";c.fillRect(0,0,w,h);const m=Math.min(w,h);ex=w*.66;ey=h*.6;mx=w*.27;my=h*.9;ref=m*.68}
 const m=Math.min(w,h),now=performance.now(),o={};
 if(bs.shake&&now-bs.shake<340){o.hurt=now-bs.shake;o.dx=(Math.random()-.5)*m*.03}
 if(bs.caughtAt){const k=now-bs.caughtAt;if(k<=900)o.death=k}
 if(!(bs.caughtAt&&now-bs.caughtAt>900))bugSprite(c,bs.vis,ex,ey,ref*.76,t,o);
 const atk=bs.atkAt&&now-bs.atkAt<340,hh=ref*.33;
 c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(mx,my,ref*.2,ref*.058,0,0,7);c.fill();
 if(MI.pb){const r=MR.pb[3*8],k=hh/r[3],lunge=atk?Math.sin(Math.min(1,(now-bs.atkAt)/340)*Math.PI)*ref*.07:0;   // back view; a quick lunge when you land a hit
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";c.drawImage(MI.pb,r[0],r[1],r[2],r[3],mx-r[2]*k/2+lunge*.5,my-r[3]*k-lunge,r[2]*k,r[3]*k)}
 // your hearts, floating right above your Debugger (icons from the meadow effects sheet)
 if(!bs.tut&&MI.fx){const hf=MR.fx[7*8],he=MR.fx[7*8+1],fs=Math.round(ref/8),hw=fs*hf[2]/hf[3],gap=hw*1.05,hx0=mx-(bs.max*gap)/2+(gap-hw)/2,hy0=my-hh-fs*1.25;c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  for(let i=0;i<bs.max;i++){const r=i<bs.lives?hf:he;c.drawImage(MI.fx,r[0],r[1],r[2],r[3],hx0+i*gap,hy0,hw,fs)}}
}
function draw(t,dt){
 const ox=P.moving?DIRS[P.dir][0]*P.prog*T:0,oy=P.moving?DIRS[P.dir][1]*P.prog*T:0;
 g.setTransform(SC,0,0,SC,0,0);g.imageSmoothingEnabled=false;
 const VWp=cv.width/SC,VHp=cv.height/SC,snap=v=>Math.round(v*SC)/SC,fpx=P.x*T+ox,fpy=P.y*T+oy;
 const cx=snap(W*T<=VWp?-(VWp-W*T)/2:Math.max(0,Math.min(W*T-VWp,fpx-VWp/2+16))),cy=snap(H*T<=VHp?-(VHp-H*T)/2:Math.max(0,Math.min(H*T-VHp,fpy-VHp/2+16)));
 g.fillStyle="#0b1a14";g.fillRect(0,0,VWp,VHp);
 (REG===2?drawForestWorld:drawMeadowWorld)(t,dt,cx,cy,VWp,VHp,fpx,fpy);
}

// ---------- Region 1: the Meadow Mainframe, drawn from assets/meadow ----------
// env sheet (4x4): 0 oak, 1 birch, 2 pine, 3 flower bush, 4 rocks, 5 log, 6 stump, 7 fern, 8 flowers, 9 wheat grass, 10 cattails, 11 lily pads, 12 sign, 13 chest, 14 chest open, 15 fence
// sys sheet (4x4): 0 lab, 1 cottage, 2/3 lantern broken/fixed, 4/5 pump, 6/7 bell, 8/9 gate closed/open, 10/11 compiler, 12 crates, 13 barrel, 14 bench, 15 flower garden
const MAP1=document.createElement("canvas");MAP1.width=REG1.W*64;MAP1.height=REG1.H*64;
// static scenery: [sheet, index, centre x (tiles), base row (tiles), width (tiles)]
const MDECOR=[["sys",0,3.5,5,4.4],["sys",1,12,4,3.6],["sys",14,9,2,2],["env",4,11.5,6,1.5],["sys",12,10,11,2.3],["sys",15,3,11,2.6],["env",12,8.5,7,1.2],
 ["env",10,17.6,13.4,1.2],["env",10,22,15.4,1.2],["env",11,19.5,14.6,1.5],["env",3,15.5,12,1.4],["env",7,16,17,1.3],["env",5,24,10,1.8],["env",6,17,6,1.2],["env",3,22.5,19,1.5]];
for(let y=4;y<=12;y++)if(y!==8)MDECOR.push(["env",15,28.5,y,1.35]);   // the east fence
const MTREES=[];
(function(){const m=REG1.M,walk=(x,y)=>{const c=(m[y]||[])[x];return c!==undefined&&c!=="T"&&c!=="~"},keep=[[27,6,31,10],[5,19,7,23]];
 for(let y=0;y<REG1.H;y++)for(let x=0;x<REG1.W;x++)if(m[y][x]==="T"){
  const edge=walk(x-1,y)||walk(x+1,y)||walk(x,y-1)||walk(x,y+1)||walk(x-1,y+1)||walk(x+1,y+1)||walk(x,y+2);
  if(keep.some(k=>x>=k[0]&&x<=k[2]&&y>=k[1]&&y<=k[3]))continue;
  if(hash(x,y,501)>(edge?.9:.38))continue;
  const h=hash(x,y,502),kind=h<.45?0:(h<.72?1:2);
  MTREES.push({i:kind,cx:x+.5+(hash(x,y,503)-.5)*.7,by:y+(hash(x,y,504)-.2)*.6,w:(kind===2?2.1:2.5)+hash(x,y,505)*.5})}
 MTREES.sort((a,b)=>a.by-b.by)})();
function buildMeadow(){
 if(!MI.terrain)return;
 const m=REG1.M,w=REG1.W,h=REG1.H,c=MAP1.getContext("2d"),q=S.q;c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 const at=(x,y)=>(m[y]||[])[x],tx=(r,cc,X,Y,rot,flip,inset)=>tex(c,r,cc,X,Y,rot,flip,inset,64,MI.terrain);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const ch=m[y][x],X=x*64,Y=y*64,a=hash(x,y,1),b=hash(x,y,2),rot=(a*4)|0,flip=b<.5;
  if(ch==="T"){tx(0,5,X,Y,rot,flip);c.fillStyle="rgba(4,26,12,.45)";c.fillRect(X,Y,64,64)}
  else if(!(ch==="h"||(x>=2&&x<=12&&y>=2&&y<=11&&!"gf~".includes(ch))))tex(c,0,5,X-5,Y-5,rot,flip,3,74,MI.terrain);   // wild tall grass (the pond is cut out of it below); tiles overlap so the seams do not show
  else tex(c,0,b<.12?0:7,X-5,Y-5,rot,flip,3,74,MI.terrain);                      // the lighter, safe village lawn
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(at(x,y)==="f"){const r=MR.env[8],k=44/r[2];c.drawImage(MI.env,r[0],r[1],r[2],r[3],x*64+10+hash(x,y,7)*10,y*64+8+hash(x,y,8)*14,44,r[3]*k)}
 // the pond: a shoreline rim, then the pack's water texture through the same jagged mask
 {const wet=(x,y)=>at(x,y)==="~",mk=jaggedMask(wet,w,h);
  rimAround(c,mk,"#5fa83a","#1f5f3a");
  fillMasked(c,mk,lc=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(wet(x,y))tex(lc,4,hash(x,y,3)<.2?0:2,x*64-1,y*64-1,(hash(x,y,6)*4)|0,hash(x,y,9)<.5,1,66,MI.terrain)});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(wet(x,y)&&wet(x-1,y)&&wet(x+1,y)&&wet(x,y-1)&&wet(x,y+1)&&hash(x,y,4)<.45)tex(c,4,7,x*64,y*64,0,false,2,64,MI.terrain);
  mk.width=1}
 // dirt roads: the pack's cobbled dirt through a jagged mask with a bushy grass rim
 {const isP=(x,y)=>PATHS.has(at(x,y)),mk=jaggedMask(isP,w,h);
  rimAround(c,mk,"#6bb23c","#2a6a2a");
  const D=[[362,334],[362,508]];   // two crops of the straight vertical dirt strips (plain, and with pebbles)
  fillMasked(c,mk,lc=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(isP(x,y)){const s=D[hash(x,y,5)<.3?1:0];const fx=hash(x,y,6)<.5,fy=hash(x,y,9)<.5;lc.save();lc.translate(x*64+32,y*64+32);lc.scale(fx?-1:1,fy?-1:1);lc.drawImage(MI.terrain,s[0],s[1],50,50,-33,-33,66,66);lc.restore()}});
  mk.width=1}
 // once the village is restored, flowers bloom across the lawn
 if(q.done)for(let y=2;y<=11;y++)for(let x=2;x<=12;x++)if(at(x,y)==="h"&&hash(x,y,77)<.5){const r=MR.env[8],k=34/r[2];c.drawImage(MI.env,r[0],r[1],r[2],r[3],x*64+hash(x,y,78)*30,y*64+hash(x,y,79)*30,34,r[3]*k)}
}
const MSYS={lamp:[2,3,4.5,7,1.7],pump:[4,5,12.5,9,2.6],bell:[6,7,9.5,5,2.5]};   // [broken, fixed, centre x, base row, width]
function drawMeadowWorld(t,dt,cx,cy,VWp,VHp,fpx,fpy){
 if(!artReady||!MI.env||!MI.sys||!MI.terrain)return;
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(MAP1,-cx,-cy,REG1.W*T,REG1.H*T);
 const bmv=followByte(dt),q=S.q,spr=[],now=performance.now();
 drawPuffs(g,cx,cy);
 const pbox=[fpx-cx-14,fpy-cy-48,28,52];   // where the player stands on screen (for see-through crowns)
 const put=(sheet,i,cxT,byT,wT,alpha)=>{const img=MI[sheet],r=MR[sheet][i];if(!img)return;
  const dw=wT*T,k=dw/r[2],dh=r[3]*k,dx=cxT*T-dw/2-cx,dy=(byT+1)*T-dh-cy+3;
  if(dx>VWp||dx+dw<0||dy>VHp||dy+dh<0)return;
  const ov=alpha&&!(dx>pbox[0]+pbox[2]||dx+dw<pbox[0]||dy>pbox[1]+pbox[3]||dy+dh<pbox[1]);
  if(ov)g.globalAlpha=.45;g.drawImage(img,r[0],r[1],r[2],r[3],dx,dy,dw,dh);g.globalAlpha=1};
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
 SYS.forEach(sy=>{const d=MSYS[sy.key],fixed=!!q.fixed[sy.key];spr.push({y:(d[3]+1)*T,f:()=>put("sys",fixed?d[1]:d[0],d[2],d[3],d[4])})});
 MTREES.forEach(tr=>{if((tr.by+1)*T<cy-40||(tr.by-3)*T>cy+VHp)return;spr.push({y:(tr.by+1)*T,f:()=>put("env",tr.i,tr.cx,tr.by,tr.w,(tr.by+1)*T>fpy+T)})});
 // purple corruption still writhing around what is broken (and over the blocked south road)
 const corr=[];SYS.forEach(sy=>{if(!q.fixed[sy.key]){const d=MSYS[sy.key];corr.push([d[2]-.2,d[3]-.2])}});if(!q.done)corr.push([6.5,22.6]);
 corr.forEach((p,j)=>spr.push({y:p[1]*T+T+50,f:()=>{const r=MR.fx[3*8+Math.floor(t/120+j*2)%8],s=60/Math.max(r[2],r[3]);g.drawImage(MI.fx,r[0],r[1],r[2],r[3],p[0]*T-r[2]*s/2-cx,p[1]*T-r[3]*s/2-cy,r[2]*s,r[3]*s)}}));
 if(FX.restore&&now-FX.restore.t0<1200){const fr=Math.min(7,Math.floor((now-FX.restore.t0)/140));spr.push({y:99999,f:()=>{const r=MR.fx[5*8+fr],s=300/Math.max(r[2],r[3]);g.drawImage(MI.fx,r[0],r[1],r[2],r[3],7*T-r[2]*s/2-cx,6*T-r[3]*s/2-cy,r[2]*s,r[3]*s)}})}
 spr.sort((a,b)=>a.y-b.y).forEach(s=>s.f());
 // fireflies drift over the village once it is restored
 if(q.done)for(let i=0;i<28;i++){const wx=(hash(i,31)*REG1.W*T+Math.sin(t/1400+i*1.9)*20+t*.004*(1+hash(i,3)))%(REG1.W*T),wy=(hash(i,32)*REG1.H*T+Math.cos(t/1100+i*2.3)*14)%(REG1.H*T),sx=wx-cx,sy=wy-cy;
  if(sx<-30||sy<-30||sx>VWp+30||sy>VHp+30)continue;
  const r=MR.fx[Math.floor(t/110+i*3)%8],s=13/Math.max(r[2],r[3]);g.globalAlpha=.9;g.drawImage(MI.fx,r[0],r[1],r[2],r[3],sx-r[2]*s/2,sy-r[3]*s/2,r[2]*s,r[3]*s);g.globalAlpha=1}
 if(flash>0&&!REDUCE){g.fillStyle=`rgba(255,255,255,${Math.min(1,flash/300)})`;g.fillRect(0,0,VWp,VHp)}
}
let VIL2=null;
function villager2(){return VIL2||(VIL2=recolor("villager2",MI.vil,(h,s,l)=>(h>=80&&h<=150&&s>.25)?[215,s,l*.95]:null))}   // the second villager wears blue instead of green
// ---------- main loop (time-based; leftover time carries across tiles; a quick tap turns you in place first) ----------
let last=0,fpsN=0,fpsT=0,showFps=false;
function tryMove(carry,dt){
 const d=keys.arrowup||keys.w?0:keys.arrowright||keys.d?1:keys.arrowdown||keys.s?2:keys.arrowleft||keys.a?3:-1;
 if(d<0){P.wait=0;return false}
 if(d!==P.dir){P.dir=d;P.wait=80}
 if(P.wait>0){P.wait-=dt;return false}
 const nx=P.x+DIRS[d][0],ny=P.y+DIRS[d][1];
 if(nx<0||ny<0||nx>=W||ny>=H||SOLID.has(M[ny][nx]))return false;
 P.moving=true;P.nx=nx;P.ny=ny;P.prog=carry;return true}
function loop(t){
 requestAnimationFrame(loop);   // scheduled first, so one bad frame can never freeze the game
 const dt=Math.min(64,t-last||16);last=t;
 fpsN++;fpsT+=dt;if(fpsT>=500){const f=Math.round(fpsN*1000/fpsT);fpsN=0;fpsT=0;if(showFps)$("hf").textContent=f+" FPS"}
 if(flash>0)flash-=dt;
 if(mode=="walk"){
  if(P.moving){
   P.prog+=dt/150;P.walk+=dt/300;
   if(P.prog>=1){const carry=P.prog-1;PUFFS.push({x:P.x*T+16,y:P.y*T+30,t:performance.now()});P.ox=P.x;P.oy=P.y;P.x=P.nx;P.y=P.ny;P.moving=false;P.prog=0;P.steps++;landed();
    if(mode=="walk"&&!tryMove(carry,0))P.walk=0}
  }else if(!tryMove(0,dt))P.walk=0;
 }
 try{draw(t,dt);
 if(bs&&bs.phase=="net")netFrame(t);
 else if(mode=="battle"&&bs)foeFrame(t)}catch(e){if(!window._loopErr){window._loopErr=1;console.error("frame error:",e)}}
}
function hud(){const long=$("hl").querySelector(".long");if(long)long.textContent=" GLITCHLANDS · "+(REG===2?"SYNTAX FOREST":"MEADOW MAINFRAME");const qe=$("quest");if(qe)qe.textContent="🎯 "+(REG===2?questText2():questText());$("hx").textContent=`XP ${S.xp} · 🔥${S.streak} · 🐛${S.catches}`;const db=$("dailybtn");if(db)db.textContent=dailyN()>=3?"📅 DAILY ✓":(dailyN()>0?"📅 DAILY "+dailyN()+"/3":"📅 DAILY HUNT")}
function landed(){
 const c=M[P.y][P.x];
 S.pos={r:REG,x:P.x,y:P.y};
 if(c=="X"&&REG===1){enterForest();return}
 if(c=="E"&&REG===2){enterVillage();return}
 if(c=="X"&&REG===2){forestExit();return}
 if(GRASS.has(c)&&P.steps>2&&Math.random()<(S.catches<1?0.3:0.13)){P.steps=0;startBattle(false)}
}
// ---------- dialog ----------
let dlg=null;
function say(lines,after){mode="dialog";let i=0;
 const box=document.createElement("div");box.className="dlg";box.setAttribute("role","dialog");box.setAttribute("aria-label","Dialogue");
 const show=()=>{box.textContent=lines[i]+"   ▼";$("sr").textContent=lines[i]};show();$("stage").appendChild(box);
 box.advance=()=>{i++;if(i>=lines.length){box.remove();dlg=null;mode="walk";after&&after()}else show()};
 box.onclick=box.advance;dlg=box}
const sysBug=t=>BANK.find(b=>b.title===t);
function profTalk(){
 const n=qFixed();
 if(!S.q.on){S.q.on=true;save();hud();
  say(["PROF. SEMICOLON: Ah, a Debugger! The Great Compiler crashed, and glitches are creeping through our village. See the corrupted colours?","Three systems have broken: the lantern beside my hill, the water pump in the south-east corner, and the bell in the village square.","Walk up to each one and press Enter. A Bug is hiding in its code. Find the line, name the mistake, then FIX it and run it.","The tall grass hides wild Bugs too: good practice, and they fill your Bugdex. If a fix fails, ask Byte why!"]);return}
 if(S.q.done){say(["PROF. SEMICOLON: Look at the village! Colour everywhere. You didn't smash the Bugs: you understood them.","The south road is clear now: the Syntax Forest lies that way, and the bugs there are sneakier. Rest first, Debugger."]);return}
 if(n<3){say([`PROF. SEMICOLON: ${n} of 3 systems fixed. Still broken: ${SYS.filter(y=>!S.q.fixed[y.key]).map(y=>y.name.toLowerCase()).join(" and ")}.`,"Compare Expected with Got, find the line, then change it and press RUN."]);return}
 if(!S.q.nullo){say(["PROF. SEMICOLON: All three systems are humming again! But Nullo took the Meadow Compiler's key and is waiting at the east gate.","Out-think him and the gate will open."]);return}
 say(["PROF. SEMICOLON: The gate is open! The Meadow Compiler sits at the end of the east corridor. It's the heart of the village. Repair it."])}
function sysTalk(sy){
 if(S.q.fixed[sy.key]){say([sy.fixedLine]);return}
 if(!S.q.on){say([sy.name+": it's flickering and spitting corrupted pixels. Prof. Semicolon (white hair, by the lab hill) might know why."]);return}
 say(sy.intro,()=>startBattle(false,{bug:sysBug(sy.bug),quest:sy.key,label:sy.label}))}
function interact(){
 if(REG===2)return interact2();
 P.act={t0:performance.now()};
 const nx=P.x+DIRS[P.dir][0],ny=P.y+DIRS[P.dir][1],c=(M[ny]||[])[nx];
 if(c=="P"){S.talked=true;save();profTalk();return}
 if(c=="s"){say(["SIGN: MEADOW MAINFRAME. Prof. Semicolon's lab hill is here. Tall grass: wild Bugs. East gate: the way to the Meadow Compiler."]);return}
 if(c=="V"){say([(nx==10?"VILLAGER: An Offbyonyx skipped the last song on my playlist! Count carefully out there.":"VILLAGER: Tip: the Expected and Got lines tell you what the Bug did wrong.")]);return}
 if(c=="L"){say(["PROF. SEMICOLON'S LAB HILL: He keeps his notes up there and chases Bugs down here."]);return}
 if(c=="x"){say(["The south path is choked with glitch vines. Restore the village first."]);return}
 if(c=="1"||c=="2"||c=="3"){sysTalk(SYS[+c-1]);return}
 if(c=="N"){
  if(qFixed()<3){say([`NULLO: A lamp and a pump? Cute. Come back when your whole village hums, Debugger. (${qFixed()}/3 fixed)`]);return}
  const t2=BANK.filter(b=>!b.quest&&(TIER[b.title]||2)==2);
  say(["NULLO: So you fixed the village. I don't read the code. I just hit the biggest line.","NULLO: Let's see if you can out-think me! I have the Compiler's key."],()=>startBattle(true,{bug:t2[Math.floor(Math.random()*t2.length)]}));return}
 if(c=="C"){
  if(!S.q.nullo){say(["The Meadow Compiler is flickering behind a locked panel. Nullo has the key."]);return}
  if(S.q.done){say(["THE MEADOW COMPILER: Build succeeded. 0 errors. Hum."]);return}
  say(["THE MEADOW COMPILER: ERROR... ERROR... every system in the village depends on me...","A big Bug hides in my build counter. Fix it, Debugger!"],()=>startBattle(false,{bug:sysBug("Meadow Compiler"),quest:"compiler",label:"The Compiler crash",lives:4}))}
}
// ---------- running the player's code: runner.js in a Web Worker with a timeout; the server's CSP blocks all network access ----------
function runCode(src,ms=900){
 return new Promise(res=>{
  let w;const done=r=>{try{w&&w.terminate()}catch(e){}res(r)};
  try{
   w=new Worker("runner.js");
   const timer=setTimeout(()=>done({ok:false,err:"it ran for too long (an endless loop?)",timeout:true,out:[]}),ms);
   w.onmessage=e=>{clearTimeout(timer);done(e.data)};
   w.onerror=e=>{clearTimeout(timer);done({ok:false,err:String(e.message||"error"),out:[]})};
   w.postMessage({src:String(src)});
  }catch(e){done({ok:false,err:"cannot run code here: "+e,out:[]})}
 })}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// ---------- Claude-written bugs: fetched from the local server, then VERIFIED by running them before they are ever shown ----------
let AI_ON=false,aiFails=0;const AIQ=[];let aiBusy=false;
fetch("/api/status").then(r=>r.json()).then(j=>{AI_ON=!!j.ai;prefetchAI()}).catch(()=>{});
async function verifyBug(raw){
 try{
  const lines=String(raw.code).split("\n"),bl=raw.bug_line|0;
  if(bl<1||bl>lines.length||!CATS.includes(raw.category)||!Array.isArray(raw.out)||!raw.out.length||!Array.isArray(raw.hints)||raw.hints.length<3||typeof raw.fix!=="string")return null;
  const fixed=lines.slice();fixed[bl-1]=lines[bl-1].match(/^\s*/)[0]+raw.fix.trim();
  const extra=String(raw.extra||"").split("\n").filter(l=>l.trim());
  if(extra.length>3||!extra.every(l=>/^\s*console\s*\.\s*log\(.*\);?\s*$/.test(l)))return null;   // hidden tests may only print
  const ex=extra.length?"\n"+extra.join("\n"):"";
  const out=raw.out.map(String),f=await runCode(fixed.join("\n")+ex),b=await runCode(lines.join("\n")+ex);
  if(!f.ok||!same(f.out,out))return null;                 // the fix must really produce the claimed output
  if(b.ok&&same(b.out,out))return null;                   // and the buggy version must really behave differently
  return {title:String(raw.title||"Mystery bug"),task:String(raw.task),category:raw.category,expected:String(raw.expected),actual:String(raw.actual),code:lines.join("\n"),bug_line:bl,
   hints:raw.hints.slice(0,3).map(String),fix:raw.fix.trim(),explanation:String(raw.explanation||""),out,extra:extra.join("\n"),ok:[raw.category],src:"ai"}
 }catch(e){return null}}
async function prefetchAI(){
 if(!AI_ON||aiBusy||AIQ.length>=2||aiFails>=4)return;aiBusy=true;
 try{const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),30000);
  const r=await fetch("/api/bug",{method:"POST",body:JSON.stringify({difficulty:S.catches<4?"easy":"medium"}),signal:ctl.signal});clearTimeout(to);
  const j=await r.json(),b=j.ok?await verifyBug(j.bug):null;if(b){AIQ.push(b);aiFails=0}else aiFails++}
 catch(e){aiFails++}
 aiBusy=false;if(AIQ.length<2&&aiFails<4)setTimeout(prefetchAI,1200)}
// ================= REGION 2: THE SYNTAX FOREST (layout from level2-map.json) =================
// Route: ranger camp -> lantern clearing -> loop relay -> stream bridge -> root gate (rival) -> Forest Compiler -> exit.
const FMAP=["TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTXXTTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTTTTTTTTT..TTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTTTTTgTTT..TTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTTggggggg..TTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTgggggggg..TTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTggggggggg..TTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTggggggggg..TTT", "TTTTTTTTTTTTTgTTTTTTTTT~~~TTTTTTTggggg..C....gTT", "TTTTTTTTTTgggggggTTTTTT~~~TTTTTTTTgggg.......TTT", "TTTTTTTTTgggggggggTTTTT~~~TTTTTTTTgggg..gggggTTT", "TTTTTTTTggfffggggggTTTT~~~TTTTTTTTTggg..ggggTTTT", "TTTTTTTTggfffRgggggTTTT~~~TTTTTTTTTTgg..gggTTTTT", "TTTTTTTgggfff..gggggTTT~~~TTTTTTTTTTTTGGTTTTTTTT", "TTTTTTTTggfff..ggggTTTT~~~TTTTTTTTgTTT..TTTTTTTT", "TTTTTTTTggggg..ggggTTTT~~~TTTTTggggggg..TTTTTTTT", "TTTTTTTTTgggg..gggTTTTT~~~TTTggffffggg..TTTTTTTT", "TTTTTTTTTTggg..ggTTTTTT~~~TTTggffffggg..TTTTTTTT", "TTTTTTTTTTTTT..TTTTTTTT~~~TTgg.ffff.....gTTTTTTT", "TTTTTTTTTTTTT.........T~~~Tggg.ffff.....TTTTTTTT", "TTTTTTTTTTTTT.........g~~~gggg..ggggggggTTTTTTTT", "TTTTTTTTTTTTTTTg..gg..g~~~gfff..ggggggTTTTTTTTTT", "TTTTTTTTTTTTgggg..gg.Sg~~~gfff..gggTTTTTTTTTTTTT", "TTTTTTTTTTgggggg..gg..BBBBBfff..ggggTTTTTTTTTTTT", "TTTTTTTTTTgggggg..gg..BBBBBfff..gggTTTTTTTTTTTTT", "TTTTTTTTggg....L..ggggg~~~gfff..gggTTTTTTTTTTTTT", "TTTTTgggggg.......ggggg~~~gggg..gggTgTTTTTTTTTTT", "TTTTgggDDDg..ggggggggTT~~~Tggg..ggggggggTTTTTTTT", "TTTggggDDDg..ggggggTTTT~~~TTTT..gggggggggTTTTTTT", "TTTgggggggg..gTgTTTTTTT~~~TTTT..gggggggggTTTTTTT", "TTgggg.......ggTTTTTTTT~~~TTTT.......KggggTTTTTT", "TTTggg.......gTTTTTTTTT~~~TTTT........gggTTTTTTT", "TTTggg..ggggggTTTTTTTTT~~~TTTTTTgggggggggTTTTTTT", "TTTTgg..gggggTTTTTTTTTT~~~TTTTTTTgggggggTTTTTTTT", "TTTTTg..ggggTTTTTTTTTTT~~~TTTTTTTTTTgTTTTTTTTTTT", "TTTTTT..gTTTTTTTTTTTTTT~~~TTTTTTTTTTTTTTTTTTTTTT", "TTTTTT..TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"];
const FW=48,FH=36;
const REG2={W:FW,H:FH,M:[],spawn:[6,34]};
(function(){const m=REG2.M;FMAP.forEach(r=>m.push(r.split("").map(ch=>({g:"h",f:"g",X:"x"}[ch]||ch))));   // map file: g = moss (safe), f = encounter grass
 m[28][10]="W";m[13][39]="N";m[35][6]="E";m[35][7]="E"})();
const SPOTS=[{id:"hut",cx:8.5,by:27,w:4.8},{id:"lantern",cx:15.5,by:24,w:2.6},{id:"relay",cx:13.5,by:11,w:2.6},{id:"bridgectl",cx:21.5,by:21,w:1.5},
 {id:"gate",cx:39,by:12,w:3.7},{id:"compiler",cx:40.5,by:7,w:3.4},{id:"chest",cx:37.5,by:29,w:1.5},{id:"exitgate",cx:44,by:1,w:2.9}];
// dense forest: pines and oaks standing on the canopy tiles (collision comes from the tile map, not from these)
const KEEP_CLEAR=[[4,32,9,35],[8,26,12,30],[11,23,18,26],[11,9,16,13],[18,19,23,23],[25,19,28,24],[34,27,40,31],[35,10,42,15],[38,5,44,9],[41,0,46,3],[36,10,41,10]];   // [x0,y0,x1,y1] in tiles: no tree crowns here
const TREES=[];
(function(){const m=REG2.M,walk=(x,y)=>{const c=(m[y]||[])[x];return c!==undefined&&c!=="T"&&c!=="~"};
 for(let y=0;y<FH;y++)for(let x=0;x<FW;x++)if(m[y][x]==="T"){
  const edge=walk(x-1,y)||walk(x+1,y)||walk(x,y-1)||walk(x,y+1)||walk(x-1,y+1)||walk(x+1,y+1)||walk(x,y+2);
  if(KEEP_CLEAR.some(k=>x>=k[0]-1&&x<=k[2]+1&&y>=k[1]-1&&y<=k[3]+2))continue;
  if(hash(x,y,501)>(edge?.96:.34))continue;
  const h=hash(x,y,502),dark=x>=32&&y<=14,kind=dark&&h<.4?2:(h<.62?1:(h<.9?0:(dark?2:1)));
  TREES.push({i:kind,cx:x+.5+(hash(x,y,503)-.5)*.7,by:y+(hash(x,y,504)-.2)*.6,w:kind===0?3.3:(kind===1?2.35:2.7)+hash(x,y,505)*.5})}
 TREES.sort((a,b)=>a.by-b.by)})();
const gateOpen=()=>{const q=S.q2;return q.lantern&&q.relay&&q.bridge&&q.rival};
const repairsDone=()=>(S.q2.lantern?1:0)+(S.q2.relay?1:0)+(S.q2.bridge?1:0);
function syncForest(){   // quest progress -> collision tiles
 const m=REG2.M,q=S.q2;
 for(let y=22;y<=23;y++)for(let x=22;x<=26;x++)m[y][x]=q.bridge?"b":"B";
 m[12][38]=m[12][39]=gateOpen()?".":"G";
 m[13][39]=q.rival?".":"N";
 m[0][43]=m[0][44]=q.done?"X":"x";
}
function questText2(){
 const q=S.q2;
 if(!q.on)return "Talk to the ranger by the hut";
 if(q.done)return "Syntax Forest restored ✓ (exit: north-east)";
 const n=repairsDone();
 if(n<3)return "Repair the forest: "+n+"/3 (lantern, relay, bridge)";
 if(!q.rival)return "Out-think Nullo at the root gate";
 return "Repair the Forest Compiler (north-east)"}
// ---- travel between regions ----
function rebuild(){REG===2?buildForest():buildMeadow()}
function setRegion(n){REG=n;const R=n===1?REG1:REG2;M=R.M;W=R.W;H=R.H;if(n===2)syncForest();rebuild();S.region=n}
function placeAt(x,y,dir){Object.assign(P,{x,y,ox:x,oy:y,dir,moving:false,prog:0,wait:0,steps:0});BYT.x=x;BYT.y=y;PUFFS.length=0}
function syncGates(){REG1.M[23][6]=S.q.done?"X":"x"}
function enterForest(){flash=350;setRegion(2);placeAt(6,34,0);S.pos={r:2,x:6,y:34};save();hud();plog("region",{r:2})}
function enterVillage(){flash=350;setRegion(1);placeAt(6,22,0);S.pos={r:1,x:6,y:22};save();hud();plog("region",{r:1})}
function forestExit(){say(["RUNTIME RUINS: the way on is open.","Region 3 is still being written. Your Debugger's journey continues soon..."],()=>placeAt(43,2,2))}
// ---- talking to things ----
const byTitle=t=>BANK.find(b=>b.title===t);
function rangerTalk(){
 const q=S.q2;
 if(!q.on){q.on=true;save();hud();
  say(["RANGER: A Debugger! Thank goodness. I'm the keeper of this forest, and its systems have failed.","Three things are broken. The LANTERNS in the clearing east of my hut. The RELAY up in the north-west, pulsing corruption into the stream. And the BRIDGE CONTROLS on this side of the water.","Fix all three and the root gate will answer you. But beware: my old apprentice Nullo means to reach the shrine first.","Walk up to each broken thing and press Enter. The grass patches hide wild Bugs too. Byte will explain any failing test."]);return}
 if(q.done){say(["RANGER: Listen. The forest hums again, and the lanterns are lit all the way to the ruins. Thank you, Debugger."]);return}
 const n=repairsDone(),todo=[!q.lantern&&"lanterns (east of my hut)",!q.relay&&"relay (north-west)",!q.bridge&&"bridge controls (the west bank)"].filter(Boolean);
 if(n<3){say([`RANGER: ${n} of 3 repaired. Still broken: ${todo.join(", ")}.`,"Compare Expected with Got, find the line, then change it and press RUN."]);return}
 if(!q.rival){say(["RANGER: All three systems are humming! The root gate is to the north-east, past the bridge. Nullo is guarding it."]);return}
 say(["RANGER: The gate is open. The Forest Compiler sits in the shrine beyond it, in the north-east. Repair it, and the exit opens."])}
function checklist(){const q=S.q2,t=b=>b?"✓":"✗";return `Root gate: ${t(q.lantern)} lantern  ${t(q.relay)} relay  ${t(q.bridge)} bridge  ${t(q.rival)} Nullo`}
function interact2(){
 P.act={t0:performance.now()};
 const nx=P.x+DIRS[P.dir][0],ny=P.y+DIRS[P.dir][1],c=(M[ny]||[])[nx],q=S.q2;
 const fixBattle=(key,title,label,intro,lives)=>say(intro,()=>startBattle(false,{bug:byTitle(title),quest:key,label,lives}));
 if(c==="W"){rangerTalk();return}
 if(c==="D"){say(["The ranger's hut. Warm light glows in the window, and a pot is bubbling inside."]);return}
 if(c==="L"){if(q.lantern){say(["The lanterns burn warm and steady along the trail."]);return}
  if(!q.on){say(["The lanterns are dark and the stone is cold. The ranger by the hut might know why."]);return}
  fixBattle("lantern","Lantern Switch","Glitch in the lanterns",["The lantern stone is flickering. It should switch the lanterns on at dusk, and it isn't.","A Bug is hiding in its time check. Watch the boundary!"]);return}
 if(c==="R"){if(q.relay){say(["The relay hums quietly. The purple pulses have stopped."]);return}
  if(!q.on){say(["A cracked relay spits purple pulses into the stream. The ranger by the hut should hear about this."]);return}
  fixBattle("relay","Relay Pulse","Glitch in the relay",["The relay keeps pulsing and never stops. Corruption is leaking into the stream.","A Bug is hiding in its loop. Does it ever finish?"]);return}
 if(c==="S"){if(q.bridge){say(["The bridge controls click happily. The bridge holds."]);return}
  if(!q.on){say(["A control stone for the bridge. It's badly out of step. Maybe the ranger knows what's wrong."]);return}
  fixBattle("bridge","Bridge Planks","Glitch in the bridge controls",["The bridge controls can't lay the right number of planks, so the crossing is out.","A Bug is hiding in the counting loop."]);return}
 if(c==="B"){say(["The bridge is out. The control stone on the west bank decides how many planks to lay."]);return}
 if(c==="G"){say([checklist(),repairsDone()<3?"The gate won't answer until all three systems are repaired.":"All three systems are repaired, but Nullo is blocking the path to the gate."]);return}
 if(c==="N"){
  if(repairsDone()<3){say(["NULLO: Looking for the gate? It's shut. You haven't even finished your chores, Debugger.",checklist()]);return}
  say(["NULLO: Three systems fixed. I'm impressed. Not enough to step aside, though.","NULLO: Prove you can handle boundaries AND loops, and the gate is yours!"],()=>startBattle(true,{bug:byTitle("Nullo's Count")}));return}
 if(c==="C"){if(q.done){say(["THE FOREST COMPILER: Build succeeded. 0 errors. Hum."]);return}
  say(["THE FOREST COMPILER: ...checking... checking... one input passes, the rest fail...","A Bug hides in my slowest-build check. It must work for EVERY input. Fix it, Debugger!"],()=>startBattle(false,{bug:byTitle("Forest Compiler"),quest:"compiler",label:"The Compiler crash",lives:4}));return}
 if(c==="K"){if(q.chest){say(["The chest is empty now. The Hint Lens glints on your belt."]);return}
  say(["A mossy chest, tucked away from the path. Its lock counts wrong tries, and the count is broken."],()=>startBattle(false,{bug:byTitle("Lockbox"),quest:"chest",label:"Glitch in the lockbox"}));return}
 if(c==="x"){say(["The north-east exit is choked with purple corruption. The Forest Compiler holds the key."]);return}
}
function afterQuest2(key){
 syncForest();buildForest();hud();
 const q=S.q2,n=repairsDone(),more=(n===3&&!q.rival)?["All three systems are repaired! The root gate stirs... but a purple-coated figure blocks the path."]:[];
 if(key==="lantern")say(["The lanterns flare to life, one by one, along the northern trail.",...more]);
 else if(key==="relay")say(["The relay falls silent. The purple pulses retreat from the stream.",...more]);
 else if(key==="bridge")say(["The planks slide into place with a clunk. The bridge holds, and the east bank is open.",...more]);
 else if(key==="chest")say(["The chest springs open! Inside: a HINT LENS.","Your hints are now cheaper: the first TWO hints in every hunt cost nothing."]);
 else if(key==="rival")say(["NULLO: ...Loops and boundaries. Hm. I only skimmed the code, and you read it.","NULLO: The gate's open. Don't let the Compiler beat you."]);
 else if(key==="compiler"){FX.restore={t0:performance.now()};
  say(["THE FOREST COMPILER: Build succeeded. 0 errors. Thank you, Debugger.","The purple corruption lifts. Gold light spills down the north-east trail, and the exit opens."],()=>{
   say(["SYNTAX FOREST RESTORED","Fireflies drift between the ferns. The lanterns are lit all the way to the ruins.",`Bugs caught: ${S.catches}  ·  XP: ${S.xp}  ·  🔥 streak: ${S.streak}`,"Runtime Ruins lie beyond the north-east exit... (Region 3 is coming soon)"])})}}
const FX={restore:null};
// ---- drawing the forest: terrain.png textures, autotiled paths and water, props as depth-sorted sprites ----
const MAP2=document.createElement("canvas");MAP2.width=FW*64;MAP2.height=FH*64;
function buildForest(){
 if(!FI.terrain)return;
 const c=MAP2.getContext("2d"),m=REG2.M,q=S.q2;c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 const at=(x,y)=>(m[y]||[])[x];
 const pathy=(x,y)=>".EXxGKBb".includes(at(x,y)||" ");
 const wet=(x,y)=>{const ch=at(x,y);return ch==="~"||((ch==="B"||ch==="b")&&x>=23&&x<=25)};
 for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){
  const ch=m[y][x],X=x*64,Y=y*64,h=hash(x,y,1),h2=hash(x,y,2),rot=(h*4)|0,flip=h2<.5;
  if(wet(x,y)){
   const lN=y>0&&!wet(x,y-1),lE=!wet(x+1,y),lS=!wet(x,y+1),lW=!wet(x-1,y);
   let cell;
   if(lN&&lW)cell=[4,6];else if(lN&&lE)cell=[4,7];else if(lS&&lW)cell=[5,0];else if(lS&&lE)cell=[5,1];
   else if(lN)cell=[4,2];else if(lE&&!lW)cell=[4,3];else if(lS)cell=[4,4];else if(lW&&!lE)cell=[4,5];
   else cell=[[4,0],[4,1],[4,0],[5,3],[4,1],[5,4],[5,5],[5,6]][(h*8)|0];
   tex(c,cell[0],cell[1],X,Y,0,false,1);
  }
  else if(ch==="T"){tex(c,6,h<.5?0:1,X,Y,rot,flip);c.fillStyle="rgba(3,20,16,.42)";c.fillRect(X,Y,64,64)}   // shadowed undergrowth beneath the tree props
  else if(ch==="g")tex(c,0,h2<.9?2:3,X,Y,rot,flip);                                   // encounter ferns
  else tex(c,0,1,X,Y,rot,flip);                                              // moss floor (also under paths, objects and the bridge banks)
  if((ch==="B"||ch==="b")&&q.bridge){tex(c,6,7,X,Y,0,false,2)}
 }
 // ---- paths: any width. A jagged pixel mask built from the map, a bushy dark rim, and sand painted by hand: warm earth, speckle and the odd pebble ----
 {const isP=(x,y)=>".EXxGK".includes(at(x,y)||" "),mk=jaggedMask(isP,FW,FH);
  rimAround(c,mk,"#2d5a28","#183a1c");
  fillMasked(c,mk,pc=>{for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){if(!isP(x,y))continue;const X=x*64,Y=y*64,h=hash(x,y,610);
   pc.fillStyle="hsl("+(34+h*5)+",58%,"+(63+h*6)+"%)";pc.fillRect(X-1,Y-1,66,66);
   for(let i=0;i<10;i++){const px=X+hash(x,y,620+i)*58,py=Y+hash(x,y,640+i)*58,w=3+((hash(x,y,660+i)*5)|0);pc.fillStyle=hash(x,y,680+i)<.5?"rgba(150,100,45,.30)":"rgba(255,236,170,.38)";pc.fillRect(px,py,w,w)}
   if(hash(x,y,700)<.3){const px=X+8+hash(x,y,701)*44,py=Y+8+hash(x,y,702)*44;pc.fillStyle="#3a3840";pc.fillRect(px-1,py-1,10,8);pc.fillStyle="#8e8c96";pc.fillRect(px,py,8,6);pc.fillStyle="#b4b2bc";pc.fillRect(px+1,py,3,2)}}});
  mk.width=1}
 if(q.bridge){   // rails along both sides of the deck, with a post at every second plank joint
  const bx=22*64,by=22*64,bw=5*64,bh=2*64;
  c.fillStyle="#2c1c10";c.fillRect(bx,by-4,bw,10);c.fillRect(bx,by+bh-6,bw,10);
  c.fillStyle="#7a5230";c.fillRect(bx,by-2,bw,5);c.fillRect(bx,by+bh-4,bw,5);
  for(let i=0;i<=4;i+=2)for(const yy of[by-4,by+bh-4]){c.fillStyle="#2c1c10";c.fillRect(bx+i*64-12,yy-14,26,30);c.fillStyle="#9a6a3c";c.fillRect(bx+i*64-9,yy-12,20,24);c.fillStyle="#c08a52";c.fillRect(bx+i*64-9,yy-12,20,6)}}
 // canopy walls get a dark rim on their open sides
 for(let y=0;y<FH;y++)for(let x=0;x<FW;x++)if(m[y][x]==="T"){
  const X=x*64,Y=y*64,open=(dx,dy)=>{const ch=(m[y+dy]||[])[x+dx];return ch!==undefined&&ch!=="T"};
  c.fillStyle="rgba(5,18,16,.5)";
  if(open(0,-1))c.fillRect(X,Y,64,6);if(open(0,1))c.fillRect(X,Y+58,64,6);if(open(-1,0))c.fillRect(X,Y,6,64);if(open(1,0))c.fillRect(X+58,Y,6,64)}
 for(let i=0;i<220;i++){const bx=hash(i,901)*FW*64,by=hash(i,902)*FH*64,br=90+hash(i,903)*150,gg=c.createRadialGradient(bx,by,0,bx,by,br);
  gg.addColorStop(0,i%3?"rgba(2,22,14,.16)":"rgba(120,190,110,.07)");gg.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=gg;c.fillRect(bx-br,by-br,br*2,br*2)}
 c.fillStyle="rgba(8,24,30,.14)";c.fillRect(0,0,MAP2.width,MAP2.height);   // dusk wash
 if(!q.done){   // the corruption zone around the shrine
  const g2=c.createRadialGradient(41*64,7*64,40,41*64,7*64,9*64);g2.addColorStop(0,"rgba(110,40,150,.42)");g2.addColorStop(1,"rgba(110,40,150,0)");c.fillStyle=g2;c.fillRect(30*64,0,18*64,16*64)}
}
const WARDEN_SHEET={};
function wardenSheet(){   // the rival sprite recoloured into the old forest ranger
 if(WARDEN_SHEET.c||!FI.npcs)return WARDEN_SHEET.c;
 WARDEN_SHEET.c=recolor("npc:warden",FI.npcs,(h,s,l)=>{
  if(s>.18&&h>=250&&h<=340)return[28,.42,l*.9];
  if(s>.18&&h>=150&&h<=200)return[95,.35,l*.9];
  if(s>.2&&h>=30&&h<=60&&l>.55)return[0,0,Math.min(.92,l*.95)];
  return null});
 return WARDEN_SHEET.c}
function iconHi(c,row,col,x,y,size){const r=FR.effects[row*8+col],s=size/Math.max(r[2],r[3]);c.imageSmoothingEnabled=true;c.drawImage(FI.effects,r[0],r[1],r[2],r[3],x-r[2]*s/2,y-r[3]*s/2,r[2]*s,r[3]*s)}
function drawForestWorld(t,dt,cx,cy,VWp,VHp,fpx,fpy){
 if(!artReady||!FI.props||!FI.terrain)return;
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(MAP2,-cx,-cy,FW*T,FH*T);
 const bmv=followByte(dt);
 drawPuffs(g,cx,cy);
 const q=S.q2,spr=[],now=performance.now();
 const pbox=[fpx-cx-14,fpy-cy-48,28,52];   // where the player stands on screen (for see-through crowns)
 spr.push({y:fpy+T,f:()=>actor(g,"player",fpx-cx,fpy-cy,P.dir,P.moving,t)});
 spr.push({y:BYT.y*T+T+2,f:()=>byteSprite(g,t,cx,cy,bmv)});
 const ws=wardenSheet();
 spr.push({y:28*T+T,f:()=>{if(ws)actorHi(g,"warden",10*T-cx,28*T-cy,3,false,t,{tag:"RANGER",sheet:ws});if(!q.on)iconHi(g,7,0,10*T+16-cx,28*T-44-cy+Math.sin(t/260)*3,22)}});
 if(M[13][39]==="N")spr.push({y:13*T+T,f:()=>actor(g,"nullo",39*T-cx,13*T-cy,0,false,t,{tag:"NULLO"})});
 const drawP=(i,pcx,by,w,alpha)=>{const r=FR.props[i],dw=w*T,kk=dw/r[2],dh=r[3]*kk,dx=pcx*T-dw/2-cx,dy=(by+1)*T-dh-cy+3;
  if(dx>VWp||dx+dw<0||dy>VHp||dy+dh<0)return;
  const ov=alpha&&!(dx>pbox[0]+pbox[2]||dx+dw<pbox[0]||dy>pbox[1]+pbox[3]||dy+dh<pbox[1]);
  g.imageSmoothingEnabled=true;if(ov)g.globalAlpha=.45;g.drawImage(FI.props,r[0],r[1],r[2],r[3],dx,dy,dw,dh);g.globalAlpha=1};
 TREES.forEach(tr=>{const by=tr.by;if((by+1)*T<cy-40||(by-3)*T>cy+VHp)return;spr.push({y:(by+1)*T,f:()=>drawP(tr.i,tr.cx,by,tr.w,(by+1)*T>fpy+T)})});
 SPOTS.forEach(sp=>{
  const i={hut:8,lantern:q.lantern?13:12,relay:q.relay?13:12,bridgectl:7,gate:gateOpen()?11:10,compiler:q.done?13:12,chest:q.chest?15:14,exitgate:q.done?11:10}[sp.id];
  spr.push({y:(sp.by+1)*T,f:()=>{drawP(i,sp.cx,sp.by,sp.w,false);
   const top=(sp.by+1)*T-cy-FR.props[i][3]*(sp.w*T/FR.props[i][2])+Math.sin(t/300)*2;
   if(sp.id==="gate"&&!gateOpen())iconHi(g,7,3,sp.cx*T-cx,top-6,22);
   if(sp.id==="chest"&&!q.chest&&q.bridge)iconHi(g,7,0,sp.cx*T-cx,top-4,16);
   if((sp.id==="lantern"&&q.lantern)||(sp.id==="relay"&&q.relay)||(sp.id==="compiler"&&q.done)){g.globalAlpha=.5+.2*Math.sin(t/400);iconHi(g,4,0,sp.cx*T-cx,(sp.by-.9)*T-cy,80);g.globalAlpha=1}}})});
 // corruption writhing around what is still broken
 const corr=[];if(!q.done)corr.push([38.3,7.4],[43.3,7.2],[41.4,9.1],[39.0,4.6],[43.8,4.4]);if(!q.relay)corr.push([13.5,11.4],[12.5,10.5],[14.7,10.8]);
 corr.forEach((p,j)=>spr.push({y:p[1]*T+T+50,f:()=>{const fr=Math.floor(t/120+j*2)%8,r=FR.effects[3*8+fr],s=62/Math.max(r[2],r[3]);g.drawImage(FI.effects,r[0],r[1],r[2],r[3],p[0]*T-r[2]*s/2-cx,p[1]*T-r[3]*s/2-cy,r[2]*s,r[3]*s)}}));
 if(FX.restore&&now-FX.restore.t0<1200){const fr=Math.min(7,Math.floor((now-FX.restore.t0)/140));spr.push({y:99999,f:()=>{const r=FR.effects[4*8+fr],s=320/Math.max(r[2],r[3]);g.drawImage(FI.effects,r[0],r[1],r[2],r[3],40.5*T-r[2]*s/2-cx,6*T-r[3]*s/2-cy,r[2]*s,r[3]*s)}})}
 spr.sort((a,b)=>a.y-b.y).forEach(s=>s.f());
 // drifting fireflies: more once the forest is healed
 const nf=q.done?34:14;
 for(let i=0;i<nf;i++){const wx=(hash(i,31)*FW*T+Math.sin(t/1400+i*1.9)*20+t*.004*(1+hash(i,3)))%(FW*T),wy=(hash(i,32)*FH*T+Math.cos(t/1100+i*2.3)*14)%(FH*T);
  const sx=wx-cx,sy=wy-cy;if(sx<-30||sy<-30||sx>VWp+30||sy>VHp+30)continue;
  const fr=Math.floor(t/110+i*3)%8,r=FR.effects[fr],s=(q.done?15:10)/Math.max(r[2],r[3]);g.globalAlpha=.9;g.drawImage(FI.effects,r[0],r[1],r[2],r[3],sx-r[2]*s/2,sy-r[3]*s/2,r[2]*s,r[3]*s);g.globalAlpha=1}
 if(flash>0&&!REDUCE){g.fillStyle=`rgba(255,255,255,${Math.min(1,flash/300)})`;g.fillRect(0,0,VWp,VHp)}
}
// ---------- battle ----------
let B=null,bs=null,lastTitle="";
function pickBug(){
 if(!S.tut)return BANK.find(b=>b.title==="Pizza Party Problem");
 const tmax=S.catches<3?1:S.catches<8?2:3;
 const pool=REG===2?BANK.filter(b=>!b.quest&&!b.quest2&&b.title!==lastTitle&&(b.r2||(TIER[b.title]||2)>=2)):BANK.filter(b=>!b.quest&&!b.r2&&b.title!==lastTitle&&(TIER[b.title]||2)<=tmax);
 const w=pool.map(b=>{const s=S.stats[b.category]||{hit:0,miss:0};return Math.max(1,1+s.miss*1.5-s.hit*0.4)});
 let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0)return pool[i]}return pool[0]}
function dailySet(){   // 3 different bugs per day, picked by the date: ~1000 combinations from the bank
 let h=0;for(const ch of today())h=(h*31+ch.charCodeAt(0))>>>0;const rnd=()=>{h=(h*1664525+1013904223)>>>0;return h/4294967296};
 const pool=BANK.filter(b=>!b.quest&&!b.r2&&(TIER[b.title]||2)<=2).slice();for(let i=pool.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
 const out=[],cats=new Set();for(const b of pool){if(!cats.has(b.category)){out.push(b);cats.add(b.category)}if(out.length==3)break}
 for(const b of pool){if(out.length>=3)break;if(!out.includes(b))out.push(b)}return out}
function dailyN(){return(S.daily&&S.daily.date===today())?S.daily.n:0}
function startDaily(){
 if(mode!=="walk"||P.moving)return;
 const n=dailyN();
 if(n>=3){say(["You cleared all 3 of today's Bugs of the Day. A new set arrives tomorrow!"]);return}
 startBattle(false,{daily:true,bug:dailySet()[n],idx:n})}
const art=n=>/^[aeiou]/i.test(n)?"an":"a";
function plog(ev,x){try{S.log=S.log||[];S.log.push(Object.assign({t:Date.now(),sid:S.sid,ev:ev,b:B&&B.title,ph:bs&&bs.phase,lives:bs&&bs.lives},x||{}));if(S.log.length>800)S.log.splice(0,S.log.length-800);save()}catch(e){}}
const esc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;");
function dprv(){return Math.min(3,window.devicePixelRatio||1)}
function fitField(){const c=$("fc"),f=$("field");if(!f||!f.clientWidth)return;const d=dprv();c.width=Math.round(f.clientWidth*d);c.height=Math.round(f.clientHeight*d);c._d=d}
function hl(l){   // tiny syntax highlighter so the code reads like an editor
 return esc(l).replace(/(\/\/.*$)|("[^"]*"|'[^']*')|\b(const|let|var|function|return|if|else|for|while|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b|\b([a-zA-Z_]\w*)(?=\()/g,
  (m,cm,st,kw,nu,fn)=>cm?'<span class="c">'+m+'</span>':st?'<span class="s">'+m+'</span>':kw?'<span class="k">'+m+'</span>':nu?'<span class="n">'+m+'</span>':'<span class="f">'+m+'</span>')}
function show(id,on){$(id).style.display=on?"":"none"}
function renderCode(edit){
 $("code").innerHTML=B.code.split("\n").map((l,i)=>(edit&&i==B.bug_line-1)
  ?`<div class="ln edit" data-n="${i}"><b>${i+1}</b><input id="fxin" value="${esc(l).replace(/"/g,"&quot;")}" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off"></div>`
  :`<div class="ln" data-n="${i}" role="button" tabindex="0"><b>${i+1}</b><pre>${hl(l)||" "}</pre></div>`).join("")}
function startBattle(rival,opts={}){
 mode="battle";flash=300;
 const ai=(!rival&&!opts.daily&&S.tut)?AIQ.shift():null;
 B=opts.bug||(ai||pickBug());lastTitle=B.title;
 const vis=makeVis(pick(catList()),rival),tut=!S.tut&&!rival&&!opts.daily,max=tut?99:(opts.lives||(S.catches<3?5:3));   // the look is random: it never reveals the bug's type
 bs={phase:"line",cur:0,lives:max,max,hints:0,hintTxt:"",crossed:new Set(),opts:[],ci:0,rival,won:false,vis,tut,daily:!!opts.daily,didx:opts.idx||0,runs:0,typeTries:0,quest:opts.quest||null,reg:REG,byteAsks:0,fail:null,byteTxt:"",t0:Date.now()};
 if(opts.quest==="compiler")vis.scale=1.25;
 $("battle").classList.add("on");fitField();
 $("fname").textContent="mystery_bug.js";
 $("meinfo").textContent="XP "+S.xp+" · 🔥"+S.streak;$("xpbar").style.width=Math.min(100,(S.xp%150)/1.5)+"%";
 show("code",true);show("picked",false);show("menu",false);show("result",false);show("fxbar",false);show("fxout",false);show("hintbtn",true);
 $("fn").textContent=rival?"NULLO'S RUSH":opts.quest?opts.label.toUpperCase():(opts.daily?"BUG OF THE DAY "+(opts.idx+1)+"/3":"WILD BUG "+vis.epi.toUpperCase())+(vis.shiny?" ✨":"");
 $("fl").textContent=rival||opts.daily||opts.quest?"":"  Lv."+(tut?1:3);
 $("ft").textContent=(B.src=="ai"?"🤖 written by Claude · verified by running it":"📘 from the bug bank")+" · type unknown";
 $("fhp").style.width="100%";
 renderCode(false);
 $("code").onclick=e=>{const l=e.target.closest(".ln");if(l&&bs&&bs.phase=="line"){bs.cur=+l.dataset.n;paintCode();pickLine()}};
 if(tut){bs.hints=1;bs.hintTxt=B.hints[0]}
 plog("start",{src:B.src||"bank",quest:opts.quest||null,rival:!!rival,daily:!!opts.daily,tut});
 paintCode();info(rival?"Nullo challenges you! ":opts.quest?"The glitch fights back! ":(opts.daily?"Daily hunt, bug "+(opts.idx+1)+" of 3! ":"A wild Bug appeared! "));
 prefetchAI();
}
function info(pre=""){
 $("hearts").innerHTML=bs.tut?'<span style="font-size:14px;letter-spacing:0">Practice round: unlimited tries</span>':"";$("hearts").style.display=bs.tut?"":"none";
 $("goal").innerHTML=`<b>GOAL:</b> ${esc(B.task)}<div class="chips"><span class="e">Expected: <code>${esc(B.expected)}</code></span><span class="g">Got: <code>${esc(B.actual)}</code></span></div>`;
 const ins={line:bs.tut?"STEP 1: Click the line where Got goes wrong.":"Click the BUGGY line.",
  type:"STEP 2: Which label fits best? (Practice only: no heart is lost.) Click one, or press 1-"+bs.opts.length+".",
  fix:"STEP 3: Edit the highlighted line so the program prints what's Expected, then press RUN (Enter)."}[bs.phase]||"";
 $("msg").textContent=pre+ins;
 show("goal",bs.phase!="done");
 $("fhp").style.width=({line:100,type:66,fix:33,fixed:0,done0:0,done:bs.won?0:100})[bs.phase]+"%";
 const h=$("hint"),hh=(bs.hintTxt?"💡 <b>PROF:</b> "+esc(bs.hintTxt):"")+(bs.byteTxt?(bs.hintTxt?"<br>":"")+"🐤 <b>BYTE:</b> "+bs.byteTxt:"");if(hh&&bs.phase!="done"){h.style.display="";h.innerHTML=hh}else h.style.display="none";
 $("hintbtn").textContent="💡 HINT ("+(3-bs.hints)+")";$("hintbtn").disabled=bs.hints>=3;
}
function paintCode(){[...$("code").children].forEach((d,i)=>{d.classList.toggle("cur",i==bs.cur&&bs.phase=="line");d.classList.toggle("cross",bs.crossed.has(i))});
 const c=$("code").children[bs.cur];c&&c.scrollIntoView({block:"nearest"})}
function miss(){const s=S.stats[B.category]=S.stats[B.category]||{hit:0,miss:0};s.miss++;save()}
function lose(msg){   // one wrong move costs a heart (practice round: free)
 miss();bs.shake=performance.now();if(!bs.tut)bs.lives--;
 if(bs.lives<=0){finish(false);return true}
 info(msg);return false}
function pickLine(){
 if(bs.cur==B.bug_line-1){
  plog("line",{ok:true});bs.phase="type";
  const pool=catList().filter(c=>!B.ok.some(o=>blurry(o).has(c))),n=Math.min(S.catches<5?2:3,pool.length);
  bs.opts=[B.category,...pool.sort(()=>Math.random()-.5).slice(0,n)].sort(()=>Math.random()-.5);bs.ci=0;
  show("code",false);show("picked",true);show("menu",true);bs.atkAt=performance.now();
  $("picked").innerHTML=`<b>Buggy line ${B.bug_line}:</b> <code>${esc(B.code.split("\n")[B.bug_line-1].trim())}</code>`;
  paintMenu();info("Right line! ");
 }else{
  plog("line",{ok:false});bs.crossed.add(bs.cur);paintCode();
  // only the practice round tells you which way to look; real hunts make you think
  if(!lose("Not that line"+(bs.tut?" (practice tip: the bug is "+(bs.cur<B.bug_line-1?"further DOWN":"further UP")+")":"")+". "))paintCode();
 }
}
function paintMenu(){$("menu").innerHTML=bs.opts.map((o,i)=>`<div class="opt ${i==bs.ci?"cur":""}" role="button" tabindex="0" aria-pressed="${i==bs.ci}" data-i="${i}" style="--c:${(SPECIES[o]||[0,"#7fd89a"])[1]}"><span class="k">${i+1}</span><b>${o}</b><small>${DESC[o]}</small></div>`).join("")}
for(const id of ["code","menu"])$(id).addEventListener("keydown",e=>{const t=e.target.closest&&e.target.closest(".ln,.opt");if(t&&(e.key==="Enter"||e.key===" ")){e.preventDefault();e.stopPropagation();t.click()}});   // lines and options are keyboard-operable
$("menu").onclick=e=>{const d=e.target.closest("[data-i]");if(d&&bs&&bs.phase=="type"){bs.ci=+d.dataset.i;pickType()}};
function pickType(){
 const c=bs.opts[bs.ci];
 if(B.ok.includes(c)){plog("type",{ok:true,tries:bs.typeTries});if(bs.typeTries==0)bs.typeBonus=5;return startFix()}
 // naming the mistake is practice, not the test (the repair is): a wrong label costs nothing, and every option stays available
 plog("type",{ok:false});bs.typeTries++;info("Not quite. That label doesn't fit this bug: re-read the descriptions. ")}
// ---------- STEP 3: actually fix the code, then run it ----------
function startFix(){
 plog("fix-start");bs.phase="fix";show("picked",false);show("menu",false);show("code",true);show("fxbar",true);show("fxout",true);
 $("fxout").innerHTML='<span class="dim">Press RUN to see what your program prints.</span>';
 renderCode(true);bs.atkAt=performance.now();
 if(bs.tut&&bs.hints<3){bs.hints=3;bs.hintTxt=B.hints[2]}
 info("Now fix it! ");
 const inp=$("fxin");if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)}
}
function resetFix(){if(bs&&bs.phase=="fix"){const i=$("fxin");if(i){i.value=B.code.split("\n")[B.bug_line-1];i.focus()}}}
function giveUp(){if(bs&&bs.phase=="fix"){plog("giveup",{runs:bs.runs});finish(false)}}
let running=false;
const q2=t=>"<code>"+esc(t)+"</code>";
function byteAsk(){   // Byte reads the last failing run and says, in plain words, which test failed and what that suggests
 if(!bs||bs.phase!=="fix")return;bs.byteAsks++;plog("byte",{has:!!bs.fail});
 const f=bs.fail;
 if(!f){bs.byteTxt="Run your fix first. I can only explain a test once it has failed!";info();return}
 let t;
 if(f.err){
  if(f.timeout||/too much output/i.test(f.err))t="your program never finishes (or prints forever). A loop isn't moving toward its stop condition. Check what changes each time round.";
  else if(/not defined|find variable/i.test(f.err)){const m=f.err.match(/variable:\s*(\w+)/i)||f.err.match(/(\w+) is not defined/);t="it uses a name the computer doesn't know"+(m?" ("+q2(m[1])+")":"")+". Compare the spelling with the variables in the code above.";}
  else if(/syntax|unexpected/i.test(f.err))t="something is missing or extra: a bracket, a quote or an operator. Read your line slowly, symbol by symbol.";
  else t="it crashed with "+q2(f.err)+". Look at the values your line uses.";
 }else{
  const exp=B.out,got=f.out;let i=0;while(i<exp.length&&got[i]===exp[i])i++;
  const hidden=i>=f.vis&&B.extra,E=exp[i]==null?"(nothing)":exp[i],A=got[i]==null?"(nothing)":got[i];
  if(hidden){t="your fix passes the example, but a hidden test fails. The test "+q2(B.extra.split("\n")[Math.min(i-f.vis,B.extra.split("\n").length-1)].trim())+" should print "+q2(E)+" but printed "+q2(A)+". Your change works for one input, not for all of them.";}
  else{
   t="the output doesn't match. Line "+(i+1)+" should print "+q2(E)+" but your program printed "+q2(A)+". ";
   if(/undefined/.test(A))t+="'undefined' means a value was never given back or the wrong thing was read.";
   else if(got.length<exp.length)t+="It printed fewer lines than expected, so something stops too early.";
   else if(got.length>exp.length)t+="It printed too many lines, so something runs too long.";
   else if(!isNaN(+E)&&!isNaN(+A))t+="The number is "+(Math.abs(+A-+E))+" "+(+A>+E?"too big":"too small")+". Check the arithmetic on your line.";
   else{const ne=String(E).match(/-?\d+(?:\.\d+)?/g),na=String(A).match(/-?\d+(?:\.\d+)?/g);
    if(ne&&na&&ne.length==na.length&&String(E).replace(/-?\d+(?:\.\d+)?/g,"#")===String(A).replace(/-?\d+(?:\.\d+)?/g,"#")){const k=ne.findIndex((v,j)=>v!==na[j]);t+="The words are right but a number is off: it should be "+ne[k]+" and it is "+na[k]+" ("+(+na[k]>+ne[k]?"too big":"too small")+" by "+Math.abs(+na[k]-+ne[k])+"). Check the arithmetic on your line."}
    else t+="Compare them character by character."}}
 }
 bs.byteTxt=t;info()}
async function runFix(){
 if(!bs||bs.phase!=="fix"||running)return;
 const inp=$("fxin"),orig=B.code.split("\n")[B.bug_line-1],val=(inp.value||"").replace(/\s+$/,"");
 const fo=$("fxout");
 if(!val.trim()||val.trim()===orig.trim()){fo.innerHTML='<span class="bad">Change something first. Look at Expected vs Got, then edit the line.</span>';return}
 if(/console\s*\.\s*log/.test(val)&&!/console\s*\.\s*log/.test(orig)){fo.innerHTML='<span class="bad">Fix the logic. Printing the answer yourself doesn\'t count!</span>';return}
 running=true;$("fxrun").disabled=true;fo.innerHTML='<span class="dim">Running…</span>';
 const lines=B.code.split("\n");lines[B.bug_line-1]=val;
 const r=await runCode(lines.join("\n")+(B.extra?"\n"+B.extra:""));
 running=false;if(!bs||bs.phase!=="fix")return;$("fxrun").disabled=false;bs.runs++;
 const extraN=B.extra?B.extra.split("console.log").length-1:0,vis=B.out.length-extraN;
 const shown=r.out.slice(0,vis).map(esc).join("\n")||"(nothing)";
 bs.fail=r.ok?{out:r.out,vis}:{err:r.err,timeout:!!r.timeout};
 if(!r.ok){plog("run",{ok:false,why:"crash"});fo.innerHTML=`<span class="bad">Your code crashed: ${esc(r.err)}</span>\n<span class="dim">Check the syntax. No heart lost for crashes.</span>`;return}
 if(same(r.out,B.out)){
  plog("run",{ok:true,n:bs.runs});bs.byteTxt="";
  fo.innerHTML=`<span class="ok">✅ It printed:</span>\n${shown}\n<span class="ok">That's exactly what was expected!</span>`;
  bs.phase="fixed";bs.fixedLine=val.trim();$("fxrun").disabled=true;
  $("msg").textContent="Bug fixed! Now throw the net…";
  setTimeout(()=>{if(bs&&bs.phase==="fixed")startNet()},1000);return}
 const visOK=same(r.out.slice(0,vis),B.out.slice(0,vis));
 fo.innerHTML=`<span class="bad">✗ It printed:</span>\n${shown}\n<span class="dim">Expected:</span>\n${B.out.slice(0,vis).map(esc).join("\n")}`+(visOK?'\n<span class="bad">It works for the example, but fails a hidden check with other inputs. Fix the logic itself.</span>':"");
 plog("run",{ok:false,why:visOK?"hidden":"output"});lose("Not quite. ");
}
// ---------- STEP 4 (bonus): throw the net. The ring passes the sweet spot and keeps shrinking; doing nothing = a miss ----------
const qc=$("qc"),q=qc.getContext("2d");
const NET_R=p=>200-190*p;   // radius: 200 -> 10; the sweet spot (40) is crossed at p=0.84
function startNet(){bs.phase="net";bs.qs=performance.now();bs.dur=2000;show("menu",false);const d=dprv();qc.width=Math.round(innerWidth*d);qc.height=Math.round(innerHeight*d);qc._d=d;qc.style.display="block"}
function netFrame(now){
 const d=qc._d||1,w=qc.width/d,h=qc.height/d,cx=w/2,cy=h*.45,u=Math.min(w,h)/576;q.setTransform(d,0,0,d,0,0);
 const p=Math.min(1,(now-bs.qs)/bs.dur),r=NET_R(p)*u;
 q.clearRect(0,0,w,h);q.fillStyle="rgba(6,17,11,.93)";q.fillRect(0,0,w,h);
 bugSprite(q,bs.vis,cx,cy+160*u,250*u,now);
 q.lineWidth=Math.max(3,6*u);q.strokeStyle="#7fd89a";q.beginPath();q.arc(cx,cy,40*u,0,7);q.stroke();       // sweet spot
 q.strokeStyle="#e8a24a";q.beginPath();q.arc(cx,cy,Math.max(2,r),0,7);q.stroke();                           // closing net
 q.fillStyle="#e8eeff";q.font="bold "+Math.max(16,22*u)+"px 'Courier New'";q.textAlign="center";
 q.fillText("THROW THE NET! Press Enter (or tap) when the rings meet",cx,Math.max(40,60*u));
 q.font=Math.max(12,15*u)+"px 'Courier New'";q.fillStyle="#9fc7aa";q.fillText("Bonus XP for good timing. Don't press at all and you earn nothing extra.",cx,Math.max(64,88*u));
 if(p>=1){bs.phase="done0";qc.style.display="none";finish(true,"MISS")}
}
function throwNet(now){
 if(!bs||bs.phase!=="net"||now-bs.qs<300)return;     // ignore the Enter that submitted the fix
 const p=Math.min(1,(now-bs.qs)/bs.dur),d=Math.abs(NET_R(p)-40);
 const grade=d<10?"PERFECT":d<28?"GOOD":"MISS";bs.phase="done0";qc.style.display="none";
 finish(true,grade);
}
qc.onclick=()=>throwNet(performance.now());
// ---------- result ----------
function finish(win,grade=""){
 bs.phase="done";bs.won=win;S.tut=true;show("menu",false);show("picked",false);show("code",false);show("hint",false);show("hintbtn",false);show("fxbar",false);show("fxout",false);show("result",true);show("goal",false);bs.atkAt=performance.now();
 const real=SPECIES[B.category],sp=real[0];
 $("fn").textContent=sp.toUpperCase();$("ft").textContent=B.title+" · "+B.category;   // the species is only revealed now
 if(win){
  const bonus={PERFECT:20,GOOD:8,MISS:0}[grade]||0,first=bs.runs==1?10:0;
  const gain=Math.max(10,30-Math.max(0,bs.hints-1-(S.q2.chest?1:0))*8+(bs.tut?0:Math.min(bs.lives,5)*3)+bonus+first+(bs.rival?40:0)+(bs.typeBonus||0)+(bs.quest?20:0)+(bs.vis.shiny?30:0)+(bs.daily&&bs.didx==2?50:0));
  S.xp+=gain;S.catches++;$("fhp").style.width="0%";bs.caughtAt=performance.now();
  const st=S.stats[B.category]=S.stats[B.category]||{hit:0,miss:0};st.hit++;
  const t=today();if(S.last!=t){S.streak=S.last==yesterday()?S.streak+1:1;S.last=t}
  if(bs.daily){S.daily={date:today(),n:Math.max(dailyN(),bs.didx+1)};if(S.daily.n>=3)S.dailyDone=today()}
  const d=S.dex[B.category]=S.dex[B.category]||{n:0,titles:[],shiny:0};d.n++;if(bs.vis.shiny)d.shiny=(d.shiny||0)+1;if(!d.titles.includes(B.title))d.titles.push(B.title);
  if(bs.reg===2){const k=bs.quest,q2=S.q2;if(k==="compiler")q2.done=true;else if(k==="chest")q2.chest=true;else if(k)q2[k]=true;if(bs.rival)q2.rival=true}
  else if(bs.quest==="compiler")S.q.done=true;else if(bs.quest)S.q.fixed[bs.quest]=true;
  if(bs.rival&&bs.reg!==2){S.r1done=true;S.q.nullo=true}
  $("msg").textContent="Nice work! You really debugged it.";
  $("result").innerHTML=`<div class="big okc">✅ Caught! It was ${art(sp)} ${esc(sp)}</div><div>${esc(real[2])}</div>
   <div class="fix"><b>Your fix:</b> <code>${esc(bs.fixedLine||B.fix)}</code></div>
   <div class="fix"><b>A textbook fix:</b> <code>${esc(B.fix)}</code></div><p>${esc(B.explanation)}</p>
   <div class="sm">+${gain} XP${grade?" · net: "+grade:""}${first?" · fixed on the first run (+10)":""}${bs.daily?" · daily "+(bs.didx+1)+"/3"+(bs.didx==2?" complete (+50)":""):""}</div><button data-act="end">Continue ▶ (Enter)</button>`;
 }else{
  $("msg").textContent="No worries. Reading the fix is how you learn.";
  $("result").innerHTML=`<div class="big noc">The ${esc(sp)} got away!</div><div>The bug was on line ${B.bug_line}: a <b>${esc(B.category)}</b> mistake.</div><div class="fix"><b>The fix:</b> <code>${esc(B.fix)}</code></div><p>${esc(B.explanation)}</p><button data-act="end">Continue ▶ (Enter)</button>`;
 }
 plog("end",{win,grade,runs:bs.runs,hints:bs.hints,byteAsks:bs.byteAsks,secs:Math.round((Date.now()-bs.t0)/1000)});save();hud();
}
function endBattle(){
 const rival=bs.rival,won=bs.won,daily=bs.daily,quest=bs.quest,reg=bs.reg;$("battle").classList.remove("on");qc.style.display="none";bs=null;mode="walk";prefetchAI();
 if(reg===2){if(won&&(quest||rival))afterQuest2(quest||"rival");else if(rival)say(["NULLO: Not yet. Come back when you have thought it through."]);return}
 if(daily&&won&&dailyN()<3){const n=dailyN();say(["Daily bug "+n+" of 3 cleared! Press Enter for the next one."],()=>startDaily());return}
 if(won&&quest&&quest!=="compiler"){buildMeadow();hud();const sy=SYS.find(x=>x.key===quest),n=qFixed();
  say([sy.after,n<3?"("+n+" of 3 systems fixed)":"All three systems are back online! Go and tell Prof. Semicolon."]);return}
 if(won&&quest==="compiler"){buildMeadow();hud();
  say(["THE MEADOW COMPILER: Build succeeded. 0 errors. Thank you, Debugger.","Colour floods back through the village..."],()=>{P.x=7;P.y=9;P.ox=7;P.oy=9;P.nx=7;P.ny=9;P.moving=false;P.prog=0;BYT.x=7;BYT.y=9;syncGates();buildMeadow();hud();endCard()});return}
 if(rival&&won){M[8][28]=".";buildMeadow();say(["NULLO: ...You actually read the code. Huh.","NULLO: I always smashed first and asked later. Maybe that's why my Bugs keep coming back.","NULLO: The gate's open. Syntax Forest is darker. Be careful, Debugger."])}
 else if(rival)say(["NULLO: Told you. Speed wins. Come back when you're ready."]);
}
function endCard(){
 say(["REGION 1 COMPLETE: THE MEADOW MAINFRAME IS RESTORED","The village has light, water, a ringing bell and its Compiler back. Look at the flowers!",`Bugs caught: ${S.catches}  ·  XP: ${S.xp}  ·  🔥 streak: ${S.streak}`,"The road south is open: follow it to the Syntax Forest."]);
}
// ---------- dex ----------
function toggleDex(){
 if(mode=="dex"){$("dexov").classList.remove("on");mode="walk";return}
 if(mode!="walk")return;mode="dex";
 const rows=CATS8.map(c=>{const d=S.dex[c],s=S.stats[c]||{hit:0,miss:0};
  return `<div style="margin:5px 0;display:flex;gap:8px;align-items:center"><img src="${thumb(c,!!d)}" width="36" height="36" style="flex:none"><div>${d?`<b>${SPECIES[c][0]}</b> ×${d.n} · ${SPECIES[c][2]}<br>&nbsp;&nbsp;caught: ${d.titles.join(", ")} · hits ${s.hit}/misses ${s.miss}${d.shiny?" · ✨ shiny x"+d.shiny:""}`:`??? (undiscovered ${c} bug)`}</div></div>`}).join("");
 const weak=CATS8.map(c=>[c,(S.stats[c]||{miss:0}).miss]).sort((a,b)=>b[1]-a[1])[0];
 $("dex").innerHTML=rows+`<hr>Species found: ${Object.keys(S.dex).length}/${CATS8.length}`+(weak[1]>0?`<br>🎓 PROF: "You trip on <b>${weak[0]}</b> bugs most. Expect more of them."`:"");
 $("dexov").classList.add("on");
}
// ---------- keys ----------
function onKey(k){
 if(k=="f"&&mode!="dialog"){showFps=!showFps;$("hf").style.display=showFps?"":"none";return}
 if(mode=="dialog"){if(k=="enter"||k==" ")dlg&&dlg.advance();return}
 if(mode=="dex"){if(k=="b"||k=="escape")toggleDex();return}
 if(mode=="walk"){if(k=="enter"||k==" "){if(!P.moving)interact()}else if(k=="b")toggleDex();else if(k=="t")startDaily();return}
 if(mode=="battle"&&bs){
  if(bs.phase=="net"){if(k=="enter"||k==" ")throwNet(performance.now());return}
  if(bs.phase=="fixed"||bs.phase=="done0")return;
  if(bs.phase=="fix"){if(k=="h"&&bs.hints<3){bs.hintTxt=B.hints[bs.hints++];plog("hint",{n:bs.hints});info()}return}
  if(bs.phase=="done"){if(k=="enter"||k==" ")endBattle();return}
  if(k=="escape"){plog("abandon");endBattle();return}
  if(k=="h"&&bs.hints<3){bs.hintTxt=B.hints[bs.hints++];plog("hint",{n:bs.hints});info();return}
  if(bs.phase=="line"){
   const n=B.code.split("\n").length;
   if(k=="arrowdown"||k=="s"){do{bs.cur=(bs.cur+1)%n}while(bs.crossed.has(bs.cur));paintCode()}
   else if(k=="arrowup"||k=="w"){do{bs.cur=(bs.cur-1+n)%n}while(bs.crossed.has(bs.cur));paintCode()}
   else if(k=="enter"||k==" ")pickLine();
  }else if(bs.phase=="type"){
   const n=bs.opts.length;
   if(k=="arrowdown"||k=="arrowright"||k=="s"||k=="d"){bs.ci=(bs.ci+1)%n;paintMenu()}
   else if(k=="arrowup"||k=="arrowleft"||k=="w"||k=="a"){bs.ci=(bs.ci-1+n)%n;paintMenu()}
   else if(k=="enter"||k==" ")pickType();
   else if(k>="1"&&k<="4"&&bs.opts[+k-1]){bs.ci=+k-1;pickType()}
  }
 }
}
// ---------- touch controls (phones/tablets) ----------
document.querySelectorAll("#pad [data-k]").forEach(b=>{const k=b.dataset.k;
 const on=e=>{e.preventDefault();keys[k]=true},off=e=>{e.preventDefault();delete keys[k]};
 b.addEventListener("pointerdown",on);["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,off))});
document.querySelectorAll("#pad [data-a]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();onKey(b.dataset.a)}));
// ---------- buttons: one delegated handler instead of inline onclick attributes ----------
const ACTIONS={daily:()=>startDaily(),hint:()=>onKey("h"),run:()=>runFix(),reset:()=>resetFix(),ask:()=>byteAsk(),giveup:()=>giveUp(),dex:()=>toggleDex(),end:()=>endBattle()};
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest("[data-act]");if(a&&ACTIONS[a.dataset.act])ACTIONS[a.dataset.act]()});
// ---------- read-only window onto the game state, for the integration tests (selftest.html) ----------
window.__gl={get S(){return S},get P(){return P},get B(){return B},get bs(){return bs},get M(){return M},get REG(){return REG},get dlg(){return dlg},get artReady(){return artReady},
 get mode(){return mode},set mode(v){mode=v},get BANK(){return BANK},qFixed,repairsDone,SAVE_KEY};
// ---------- boot ----------
if(S.r1done||S.q.nullo)M[8][28]=".";
syncGates();
if(S.pos&&S.pos.r===2&&S.region===2){setRegion(2);placeAt(S.pos.x,S.pos.y,0)}else buildMeadow();
hud();
if(!S.intro){mode="dialog";S.intro=true;save();
 say(["Long ago the Great Compiler kept every program in the Glitchlands running clean.","One night it crashed. Bugs, living mistakes, poured out and hid in the tall grass.","You are a new Debugger. Walk with the arrow keys or WASD. Press Enter to talk to Prof. Semicolon (the white-haired one by the lab)."])}
else mode="walk";
requestAnimationFrame(loop);
