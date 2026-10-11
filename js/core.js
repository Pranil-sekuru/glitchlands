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
const TIER={"Coin Pouch":1,"Wrong Pocket":1,"Shy Greeter":1,"Moon Coins":1,"Name Swap":1,"Silent Doubler":1,"Double Trouble":1,"Damage Dealer":1,"Birthday Candles":1,"Pizza Party Problem":1,"The Silent Function":1,"Coin Collector Glitch":1,"Is It Legal to Drive?":1,"Hot or Not":1,"Hello, Nobody":1,"Times Table Twist":3};
// ---------- state ----------
// the save slot can be changed with ?save=name (the integration tests use their own slot)
// ?dev = dev mode: hunts open straight on the fix step, no hearts lost, no net throw, an AUTO-FIX button and a skip to Region 2.
// It plays on its own save slot so it never touches real progress.
const QS=new URLSearchParams(location.search),DEV=QS.has("dev");
const SAVE_KEY=QS.get("save")||(DEV?"gl1-dev":"gl1");
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
S.starter??=null;   // the partner picked at the lab: "js", "py" or "lua"
S.team??=S.starter?[S.starter]:[];   // every language you have a partner for (the starter first; the others join when you catch a Bug of their language)
S.langCatch??={};   // Bugs caught per language
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
// Region 1 is a painted map (assets/meadow/meadow-map.jpg, 32x24 tiles); this grid is what you can walk on, laid over the painting.
// . path  h lawn  g tall grass (wild Bugs)  T trees, rocks, fences  ~ water  L lab  P professor  V villager  s sign
// 1 lantern  2 pump (and the pump keeper beside it)  3 bell  N Nullo  C Meadow Compiler  x/X the north-east trail to Syntax Forest (closed/open)  H the door of your house
const R1={start:[3,21],home:[4,6],nullo:[28,10],exit:[29,1],arrive:[29,2],door:[18,6],out:[18,7]};   // door: your house (the blue-roofed cottage)
const MEADOW=[
 "TTTTTTTTT.TTTTTTTTTTTTTTTTTTTTTT",
 "TTTTTTTTT.TTTTTTTTTTTTTTTTTTTxTT",
 "TLLLLLTTT.TTTTTTTTTTTTTTTTTTT.TT",
 "TLLLLLTTT.hTTTTTTTTTTTTTTTTTT..T",
 "TTT...hTT.TTTTTTTTTTTTTTTTTCTT.T",
 "TTTTPhhTT.TT3.hTTTTTTTTT.......T",
 "TTTT..hTT.....V.TTHTTTTTTTT.TTTT",
 "TTTT..hTT...VV..hhhTTTTTTTT..TTT",
 "TTTTh1.....TTTTTTTTTTTTTTTTT.TTT",
 "TThhh1.Th..............hTTTT.TTT",
 "TTTTTTT...TTgggggghTTT....h.N.hT",
 "TTTTTTTTT.TTggggggggTTTTT..T.TTT",
 "TTT~~~TTT.sTgTgggggghThghh...TTT",
 "TTh~~~TTT.TTT222hggggggghhTh..TT",
 "ThhTTh~TT...2TTThggggggghTThh..T",
 "TTTT.......hTTTTggggggggTTTTThhT",
 "TT...hhT~~...hhTTTThhTTTT~~TTThT",
 "TTT.TTTTTTTT.....TThTTT~~~~~~TTT",
 "TTh.TTTTTTTTTTTTThhhT~~~~~~~~TTT",
 "TTT.TTTTTTTTTTTTThTThT~~~~~~TTTT",
 "TTT.TTTTTTTTTTTTTTTTTTTTTTTTTTTT",
 "TTT.hTTTTTTTTTTTTTTTTTTTTTTTTTTT",
 "TTT..TTTTTTTTTTTTTTTTTTTTTTTTTTT",
 "TTT..TTTTTTTTTTTTTTTTTTTTTTTTTTT"];
let M=MEADOW.map(r=>r.split(""));
const REG1={M,W:32,H:24};
const SOLID=new Set(["T","~","L","P","s","N","F","V","D","1","2","3","C","x","R","K","G","S","W","B","Q","k","c","J","M","p","Y","e","n"]);   // Q..n: furniture and Mom, indoors (house.js)
const GRASS=new Set(["g","f"]);
// ---------- input ----------
let mode="intro";// walk|battle|dialog|dex|starter
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
const screenBox=$("screen");
function sizeCanvas(){
  // the zoom follows the SHORT side of the game screen, so a phone, a tablet and a wide monitor all see a sensible number of tiles:
  // Region 1 is one painting at ~45 px per tile (more upscaling only blurs it); Region 2 is drawn from tiles and zooms by whole steps;
  // your house is small, so it is zoomed to fill the screen
  const d=Math.min(3,window.devicePixelRatio||1),vw=Math.max(1,screenBox.clientWidth),vh=Math.max(1,screenBox.clientHeight),short=Math.min(vw,vh);
  const tiles=short<520?9.5:short<820?11:13;
  // indoors the room is fitted to the screen; on a tall phone screen that would be tiny, so it zooms in and the camera follows you
  const fitRoom=Math.min(vw/((W+1)*T),vh/((H+1.4)*T)),zs=REG===0?Math.max(1,Math.min(4.5,vh>vw?Math.max(fitRoom,vw/(7*T)):fitRoom))
   :REG===1?Math.max(1,Math.min(2.6,short/(tiles*T)))
   :Math.max(1,Math.min(5,Math.round(short/(tiles*T))));
  SC=zs*d;
  cv.width=Math.round(vw*d);
  cv.height=Math.round(vh*d);
  cv.style.width="100%";
  cv.style.height="100%";
  g.imageSmoothingEnabled=false
}
sizeCanvas();
// the game screen changes size with the window, the phone's rotation, the layout and the on-screen keyboard
new ResizeObserver(()=>{
  sizeCanvas();
  if(typeof fitField==="function")fitField();
  if(typeof sizeNet==="function")sizeNet()
}).observe(screenBox);
const P={x:R1.start[0],y:R1.start[1],dir:0,prog:0,moving:false,nx:0,ny:0,steps:0,walk:0,ox:R1.start[0],oy:R1.start[1],wait:0};
const BYT={x:R1.start[0],y:R1.start[1]};
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
let flash=0;
const hash=(x,y,n=0)=>{
  let h=(Math.imul(x+1,374761393)+Math.imul(y+1,668265263)+Math.imul(n+1,1274126177))|0;
  h=Math.imul(h^(h>>>13),1274126177);
  return((h^(h>>>16))>>>0)/4294967296
};
const PATHS=new Set([".","N","X","C","x"]),WATER=new Set(["~"]);
