// forest.js: Region 2 (Syntax Forest): map data, travel, interactions, ground baking, world drawing
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- Region 2 data: the 48x36 tile map, hot spots, trees, quest-driven collision ----------
// ================= REGION 2: THE SYNTAX FOREST (layout from level2-map.json) =================
// Route: ranger camp -> lantern clearing -> loop relay -> stream bridge -> root gate (rival) -> Forest Compiler -> exit.
const FMAP=["TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTXXTTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTTTTTTTTT..TTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTTTTTgTTT..TTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTTggggggg..TTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTgggggggg..TTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTggggggggg..TTT", "TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTggggggggg..TTT", "TTTTTTTTTTTTTgTTTTTTTTT~~~TTTTTTTggggg..C....gTT", "TTTTTTTTTTgggggggTTTTTT~~~TTTTTTTTgggg.......TTT", "TTTTTTTTTgggggggggTTTTT~~~TTTTTTTTgggg..gggggTTT", "TTTTTTTTggfffggggggTTTT~~~TTTTTTTTTggg..ggggTTTT", "TTTTTTTTggfffRgggggTTTT~~~TTTTTTTTTTgg..gggTTTTT", "TTTTTTTgggfff..gggggTTT~~~TTTTTTTTTTTTGGTTTTTTTT", "TTTTTTTTggfff..ggggTTTT~~~TTTTTTTTgTTT..TTTTTTTT", "TTTTTTTTggggg..ggggTTTT~~~TTTTTggggggg..TTTTTTTT", "TTTTTTTTTgggg..gggTTTTT~~~TTTggffffggg..TTTTTTTT", "TTTTTTTTTTggg..ggTTTTTT~~~TTTggffffggg..TTTTTTTT", "TTTTTTTTTTTTT..TTTTTTTT~~~TTgg.ffff.....gTTTTTTT", "TTTTTTTTTTTTT.........T~~~Tggg.ffff.....TTTTTTTT", "TTTTTTTTTTTTT.........g~~~gggg..ggggggggTTTTTTTT", "TTTTTTTTTTTTTTTg..gg..g~~~gfff..ggggggTTTTTTTTTT", "TTTTTTTTTTTTgggg..gg.Sg~~~gfff..gggTTTTTTTTTTTTT", "TTTTTTTTTTgggggg..gg..BBBBBfff..ggggTTTTTTTTTTTT", "TTTTTTTTTTgggggg..gg..BBBBBfff..gggTTTTTTTTTTTTT", "TTTTTTTTggg....L..ggggg~~~gfff..gggTTTTTTTTTTTTT", "TTTTTgggggg.......ggggg~~~gggg..gggTgTTTTTTTTTTT", "TTTTgggDDDg..ggggggggTT~~~Tggg..ggggggggTTTTTTTT", "TTTggggDDDg..ggggggTTTT~~~TTTT..gggggggggTTTTTTT", "TTTgggggggg..gTgTTTTTTT~~~TTTT..gggggggggTTTTTTT", "TTgggg.......ggTTTTTTTT~~~TTTT.......KggggTTTTTT", "TTTggg.......gTTTTTTTTT~~~TTTT........gggTTTTTTT", "TTTggg..ggggggTTTTTTTTT~~~TTTTTTgggggggggTTTTTTT", "TTTTgg..gggggTTTTTTTTTT~~~TTTTTTTgggggggTTTTTTTT", "TTTTTg..ggggTTTTTTTTTTT~~~TTTTTTTTTTgTTTTTTTTTTT", "TTTTTT..gTTTTTTTTTTTTTT~~~TTTTTTTTTTTTTTTTTTTTTT", "TTTTTT..TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"];
const FW=48,FH=36;
const REG2={W:FW,H:FH,M:[],spawn:[6,34]};
(function(){
  const m=REG2.M;
  FMAP.forEach(r=>m.push(r.split("").map(ch=>({g:"h",f:"g",X:"x"}[ch]||ch))));   // map file: g = moss (safe), f = encounter grass
  m[28][10]="W";
  m[13][39]="N";
  m[35][6]="E";
  m[35][7]="E"
})();
const SPOTS=[{id:"hut",cx:8.5,by:27,w:4.8},{id:"lantern",cx:15.5,by:24,w:2.6},{id:"relay",cx:13.5,by:11,w:2.6},{id:"bridgectl",cx:21.5,by:21,w:1.5},
 {id:"gate",cx:39,by:12,w:3.7},{id:"compiler",cx:40.5,by:7,w:3.4},{id:"chest",cx:37.5,by:29,w:1.5},{id:"exitgate",cx:44,by:1,w:2.9}];
// dense forest: pines and oaks standing on the canopy tiles (collision comes from the tile map, not from these)
const KEEP_CLEAR=[[4,32,9,35],[8,26,12,30],[11,23,18,26],[11,9,16,13],[18,19,23,23],[25,19,28,24],[34,27,40,31],[35,10,42,15],[38,5,44,9],[41,0,46,3],[36,10,41,10]];   // [x0,y0,x1,y1] in tiles: no tree crowns here
const TREES=[];
(function(){
  const m=REG2.M,walk=(x,y)=>{
    const c=(m[y]||[])[x];
    return c!==undefined&&c!=="T"&&c!=="~"
  };
  for(let y=0;y<FH;y++)for(let x=0;x<FW;x++)if(m[y][x]==="T"){
    const edge=walk(x-1,y)||walk(x+1,y)||walk(x,y-1)||walk(x,y+1)||walk(x-1,y+1)||walk(x+1,y+1)||walk(x,y+2);
    if(KEEP_CLEAR.some(k=>x>=k[0]-1&&x<=k[2]+1&&y>=k[1]-1&&y<=k[3]+2))continue;
    if(hash(x,y,501)>(edge?.96:.34))continue;
    const h=hash(x,y,502),dark=x>=32&&y<=14,kind=dark&&h<.4?2:(h<.62?1:(h<.9?0:(dark?2:1)));
    TREES.push({i:kind,cx:x+.5+(hash(x,y,503)-.5)*.7,by:y+(hash(x,y,504)-.2)*.6,w:kind===0?3.3:(kind===1?2.35:2.7)+hash(x,y,505)*.5})
  }
  TREES.sort((a,b)=>a.by-b.by)
})();
const gateOpen=()=>{
  const q=S.q2;
  return q.lantern&&q.relay&&q.bridge&&q.rival
};
const repairsDone=()=>(S.q2.lantern?1:0)+(S.q2.relay?1:0)+(S.q2.bridge?1:0);
function syncForest(){
  // quest progress -> collision tiles
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
  return "Repair the Forest Compiler (north-east)"
}
// ---- travel between regions ----
function rebuild(){
  REG===2?buildForest():buildMeadow()
}
function setRegion(n){
  REG=n;
  const R=n===1?REG1:REG2;
  M=R.M;
  W=R.W;
  H=R.H;
  if(n===2)syncForest();
  rebuild();
  S.region=n
}
function placeAt(x,y,dir){
  Object.assign(P,{x,y,ox:x,oy:y,dir,moving:false,prog:0,wait:0,steps:0});
  BYT.x=x;
  BYT.y=y;
  PUFFS.length=0
}
function syncGates(){
  REG1.M[23][6]=S.q.done?"X":"x"
}
function enterForest(){
  flash=350;
  setRegion(2);
  placeAt(6,34,0);
  S.pos={r:2,x:6,y:34};
  save();
  hud();
  plog("region",{r:2})
}
function enterVillage(){
  flash=350;
  setRegion(1);
  placeAt(6,22,0);
  S.pos={r:1,x:6,y:22};
  save();
  hud();
  plog("region",{r:1})
}
function forestExit(){
  say(["RUNTIME RUINS: the way on is open.","Region 3 is still being written. Your Debugger's journey continues soon..."],()=>placeAt(43,2,2))
}
// ---- talking to things ----
const byTitle=t=>BANK.find(b=>b.title===t);
function rangerTalk(){
  const q=S.q2;
  if(!q.on){
    q.on=true;
    save();
    hud();
    say(["RANGER: A Debugger! Thank goodness. I'm the keeper of this forest, and its systems have failed.","Three things are broken. The LANTERNS in the clearing east of my hut. The RELAY up in the north-west, pulsing corruption into the stream. And the BRIDGE CONTROLS on this side of the water.","Fix all three and the root gate will answer you. But beware: my old apprentice Nullo means to reach the shrine first.","Walk up to each broken thing and press Enter. The grass patches hide wild Bugs too. Byte will explain any failing test."]);
    return
  }
  if(q.done){
    say(["RANGER: Listen. The forest hums again, and the lanterns are lit all the way to the ruins. Thank you, Debugger."]);
    return
  }
  const n=repairsDone(),todo=[!q.lantern&&"lanterns (east of my hut)",!q.relay&&"relay (north-west)",!q.bridge&&"bridge controls (the west bank)"].filter(Boolean);
  if(n<3){
    say([`RANGER: ${n} of 3 repaired. Still broken: ${todo.join(", ")}.`,"Compare Expected with Got, find the line, then change it and press RUN."]);
    return
  }
  if(!q.rival){
    say(["RANGER: All three systems are humming! The root gate is to the north-east, past the bridge. Nullo is guarding it."]);
    return
  }
  say(["RANGER: The gate is open. The Forest Compiler sits in the shrine beyond it, in the north-east. Repair it, and the exit opens."])
}
function checklist(){
  const q=S.q2,t=b=>b?"✓":"✗";
  return `Root gate: ${t(q.lantern)} lantern  ${t(q.relay)} relay  ${t(q.bridge)} bridge  ${t(q.rival)} Nullo`
}
function interact2(){
  P.act={t0:performance.now()};
  const nx=P.x+DIRS[P.dir][0],ny=P.y+DIRS[P.dir][1],c=(M[ny]||[])[nx],q=S.q2;
  const fixBattle=(key,title,label,intro,lives)=>say(intro,()=>startBattle(false,{bug:byTitle(title),quest:key,label,lives}));
  if(c==="W"){
    rangerTalk();
    return
  }
  if(c==="D"){
    say(["The ranger's hut. Warm light glows in the window, and a pot is bubbling inside."]);
    return
  }
  if(c==="L"){
    if(q.lantern){
      say(["The lanterns burn warm and steady along the trail."]);
      return
    }
    if(!q.on){
      say(["The lanterns are dark and the stone is cold. The ranger by the hut might know why."]);
      return
    }
    fixBattle("lantern","Lantern Switch","Glitch in the lanterns",["The lantern stone is flickering. It should switch the lanterns on at dusk, and it isn't.","A Bug is hiding in its time check. Watch the boundary!"]);
    return
  }
  if(c==="R"){
    if(q.relay){
      say(["The relay hums quietly. The purple pulses have stopped."]);
      return
    }
    if(!q.on){
      say(["A cracked relay spits purple pulses into the stream. The ranger by the hut should hear about this."]);
      return
    }
    fixBattle("relay","Relay Pulse","Glitch in the relay",["The relay keeps pulsing and never stops. Corruption is leaking into the stream.","A Bug is hiding in its loop. Does it ever finish?"]);
    return
  }
  if(c==="S"){
    if(q.bridge){
      say(["The bridge controls click happily. The bridge holds."]);
      return
    }
    if(!q.on){
      say(["A control stone for the bridge. It's badly out of step. Maybe the ranger knows what's wrong."]);
      return
    }
    fixBattle("bridge","Bridge Planks","Glitch in the bridge controls",["The bridge controls can't lay the right number of planks, so the crossing is out.","A Bug is hiding in the counting loop."]);
    return
  }
  if(c==="B"){
    say(["The bridge is out. The control stone on the west bank decides how many planks to lay."]);
    return
  }
  if(c==="G"){
    say([checklist(),repairsDone()<3?"The gate won't answer until all three systems are repaired.":"All three systems are repaired, but Nullo is blocking the path to the gate."]);
    return
  }
  if(c==="N"){
    if(repairsDone()<3){
      say(["NULLO: Looking for the gate? It's shut. You haven't even finished your chores, Debugger.",checklist()]);
      return
    }
    say(["NULLO: Three systems fixed. I'm impressed. Not enough to step aside, though.","NULLO: Prove you can handle boundaries AND loops, and the gate is yours!"],()=>startBattle(true,{bug:byTitle("Nullo's Count")}));
    return
  }
  if(c==="C"){
    if(q.done){
      say(["THE FOREST COMPILER: Build succeeded. 0 errors. Hum."]);
      return
    }
    say(["THE FOREST COMPILER: ...checking... checking... one input passes, the rest fail...","A Bug hides in my slowest-build check. It must work for EVERY input. Fix it, Debugger!"],()=>startBattle(false,{bug:byTitle("Forest Compiler"),quest:"compiler",label:"The Compiler crash",lives:4}));
    return
  }
  if(c==="K"){
    if(q.chest){
      say(["The chest is empty now. The Hint Lens glints on your belt."]);
      return
    }
    say(["A mossy chest, tucked away from the path. Its lock counts wrong tries, and the count is broken."],()=>startBattle(false,{bug:byTitle("Lockbox"),quest:"chest",label:"Glitch in the lockbox"}));
    return
  }
  if(c==="x"){
    say(["The north-east exit is choked with purple corruption. The Forest Compiler holds the key."]);
    return
  }
}
function afterQuest2(key){
  syncForest();
  buildForest();
  hud();
  const q=S.q2,n=repairsDone(),more=(n===3&&!q.rival)?["All three systems are repaired! The root gate stirs... but a purple-coated figure blocks the path."]:[];
  if(key==="lantern")say(["The lanterns flare to life, one by one, along the northern trail.",...more]);
  else if(key==="relay")say(["The relay falls silent. The purple pulses retreat from the stream.",...more]);
  else if(key==="bridge")say(["The planks slide into place with a clunk. The bridge holds, and the east bank is open.",...more]);
  else if(key==="chest")say(["The chest springs open! Inside: a HINT LENS.","Your hints are now cheaper: the first TWO hints in every hunt cost nothing."]);
  else if(key==="rival")say(["NULLO: ...Loops and boundaries. Hm. I only skimmed the code, and you read it.","NULLO: The gate's open. Don't let the Compiler beat you."]);
  else if(key==="compiler"){
    FX.restore={t0:performance.now()};
    say(["THE FOREST COMPILER: Build succeeded. 0 errors. Thank you, Debugger.","The purple corruption lifts. Gold light spills down the north-east trail, and the exit opens."],()=>{
      say(["SYNTAX FOREST RESTORED","Fireflies drift between the ferns. The lanterns are lit all the way to the ruins.",`Bugs caught: ${S.catches}  ·  XP: ${S.xp}  ·  🔥 streak: ${S.streak}`,"Runtime Ruins lie beyond the north-east exit... (Region 3 is coming soon)"])
    })
  }
}
const FX={restore:null};
// ---- drawing the forest: terrain.png textures, autotiled paths and water, props as depth-sorted sprites ----
const MAP2=document.createElement("canvas");
MAP2.width=FW*64;
MAP2.height=FH*64;
function buildForest(){
  if(!FI.terrain)return;
  const c=MAP2.getContext("2d"),m=REG2.M,q=S.q2;
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality="high";
  const at=(x,y)=>(m[y]||[])[x];
  const pathy=(x,y)=>".EXxGKBb".includes(at(x,y)||" ");
  const wet=(x,y)=>{
    const ch=at(x,y);
    return ch==="~"||((ch==="B"||ch==="b")&&x>=23&&x<=25)
  };
  for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){
    const ch=m[y][x],X=x*64,Y=y*64,h=hash(x,y,1),h2=hash(x,y,2),rot=(h*4)|0,flip=h2<.5;
    if(wet(x,y)){
      const lN=y>0&&!wet(x,y-1),lE=!wet(x+1,y),lS=!wet(x,y+1),lW=!wet(x-1,y);
      let cell;
      if(lN&&lW)cell=[4,6];
      else if(lN&&lE)cell=[4,7];
      else if(lS&&lW)cell=[5,0];
      else if(lS&&lE)cell=[5,1];
      else if(lN)cell=[4,2];
      else if(lE&&!lW)cell=[4,3];
      else if(lS)cell=[4,4];
      else if(lW&&!lE)cell=[4,5];
      else cell=[[4,0],[4,1],[4,0],[5,3],[4,1],[5,4],[5,5],[5,6]][(h*8)|0];
      tex(c,cell[0],cell[1],X,Y,0,false,1);
    }
    else if(ch==="T"){
      tex(c,6,h<.5?0:1,X,Y,rot,flip);
      c.fillStyle="rgba(3,20,16,.42)";
      c.fillRect(X,Y,64,64)
    }   // shadowed undergrowth beneath the tree props
    else if(ch==="g")tex(c,0,h2<.9?2:3,X,Y,rot,flip);                                   // encounter ferns
    else tex(c,0,1,X,Y,rot,flip);                                              // moss floor (also under paths, objects and the bridge banks)
    if((ch==="B"||ch==="b")&&q.bridge){
      tex(c,6,7,X,Y,0,false,2)
    }
  }
  // ---- paths: any width. A jagged pixel mask built from the map, a bushy dark rim, and sand painted by hand: warm earth, speckle and the odd pebble ----
  {const isP=(x,y)=>".EXxGK".includes(at(x,y)||" "),mk=jaggedMask(isP,FW,FH);
  rimAround(c,mk,"#2d5a28","#183a1c");
  fillMasked(c,mk,pc=>{
    for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){
      if(!isP(x,y))continue;
      const X=x*64,Y=y*64,h=hash(x,y,610);
      pc.fillStyle="hsl("+(34+h*5)+",58%,"+(63+h*6)+"%)";
      pc.fillRect(X-1,Y-1,66,66);
      for(let i=0;i<10;i++){
        const px=X+hash(x,y,620+i)*58,py=Y+hash(x,y,640+i)*58,w=3+((hash(x,y,660+i)*5)|0);
        pc.fillStyle=hash(x,y,680+i)<.5?"rgba(150,100,45,.30)":"rgba(255,236,170,.38)";
        pc.fillRect(px,py,w,w)
      }
      if(hash(x,y,700)<.3){
        const px=X+8+hash(x,y,701)*44,py=Y+8+hash(x,y,702)*44;
        pc.fillStyle="#3a3840";
        pc.fillRect(px-1,py-1,10,8);
        pc.fillStyle="#8e8c96";
        pc.fillRect(px,py,8,6);
        pc.fillStyle="#b4b2bc";
        pc.fillRect(px+1,py,3,2)
      }
    }
  });
  mk.width=1}
  if(q.bridge){
    // rails along both sides of the deck, with a post at every second plank joint
    const bx=22*64,by=22*64,bw=5*64,bh=2*64;
    c.fillStyle="#2c1c10";
    c.fillRect(bx,by-4,bw,10);
    c.fillRect(bx,by+bh-6,bw,10);
    c.fillStyle="#7a5230";
    c.fillRect(bx,by-2,bw,5);
    c.fillRect(bx,by+bh-4,bw,5);
    for(let i=0;i<=4;i+=2)for(const yy of[by-4,by+bh-4]){
      c.fillStyle="#2c1c10";
      c.fillRect(bx+i*64-12,yy-14,26,30);
      c.fillStyle="#9a6a3c";
      c.fillRect(bx+i*64-9,yy-12,20,24);
      c.fillStyle="#c08a52";
      c.fillRect(bx+i*64-9,yy-12,20,6)
    }
  }
  // canopy walls get a dark rim on their open sides
  for(let y=0;y<FH;y++)for(let x=0;x<FW;x++)if(m[y][x]==="T"){
    const X=x*64,Y=y*64,open=(dx,dy)=>{
      const ch=(m[y+dy]||[])[x+dx];
      return ch!==undefined&&ch!=="T"
    };
    c.fillStyle="rgba(5,18,16,.5)";
    if(open(0,-1))c.fillRect(X,Y,64,6);
    if(open(0,1))c.fillRect(X,Y+58,64,6);
    if(open(-1,0))c.fillRect(X,Y,6,64);
    if(open(1,0))c.fillRect(X+58,Y,6,64)
  }
  for(let i=0;i<220;i++){
    const bx=hash(i,901)*FW*64,by=hash(i,902)*FH*64,br=90+hash(i,903)*150,gg=c.createRadialGradient(bx,by,0,bx,by,br);
    gg.addColorStop(0,i%3?"rgba(2,22,14,.16)":"rgba(120,190,110,.07)");
    gg.addColorStop(1,"rgba(0,0,0,0)");
    c.fillStyle=gg;
    c.fillRect(bx-br,by-br,br*2,br*2)
  }
  c.fillStyle="rgba(8,24,30,.14)";
  c.fillRect(0,0,MAP2.width,MAP2.height);   // dusk wash
  if(!q.done){
    // the corruption zone around the shrine
    const g2=c.createRadialGradient(41*64,7*64,40,41*64,7*64,9*64);
    g2.addColorStop(0,"rgba(110,40,150,.42)");
    g2.addColorStop(1,"rgba(110,40,150,0)");
    c.fillStyle=g2;
    c.fillRect(30*64,0,18*64,16*64)
  }
}
const WARDEN_SHEET={};
function wardenSheet(){
  // the rival sprite recoloured into the old forest ranger
  if(WARDEN_SHEET.c||!FI.npcs)return WARDEN_SHEET.c;
  WARDEN_SHEET.c=recolor("npc:warden",FI.npcs,(h,s,l)=>{
    if(s>.18&&h>=250&&h<=340)return[28,.42,l*.9];
    if(s>.18&&h>=150&&h<=200)return[95,.35,l*.9];
    if(s>.2&&h>=30&&h<=60&&l>.55)return[0,0,Math.min(.92,l*.95)];
    return null
  });
  return WARDEN_SHEET.c
}
function iconHi(c,row,col,x,y,size){
  const r=FR.effects[row*8+col],s=size/Math.max(r[2],r[3]);
  c.imageSmoothingEnabled=true;
  c.drawImage(FI.effects,r[0],r[1],r[2],r[3],x-r[2]*s/2,y-r[3]*s/2,r[2]*s,r[3]*s)
}
function drawForestWorld(t,dt,cx,cy,VWp,VHp,fpx,fpy){
  if(!artReady||!FI.props||!FI.terrain)return;
  g.imageSmoothingEnabled=true;
  g.imageSmoothingQuality="high";
  g.drawImage(MAP2,-cx,-cy,FW*T,FH*T);
  const bmv=followByte(dt);
  drawPuffs(g,cx,cy);
  const q=S.q2,spr=[],now=performance.now();
  const pbox=[fpx-cx-14,fpy-cy-48,28,52];   // where the player stands on screen (for see-through crowns)
  spr.push({y:fpy+T,f:()=>actor(g,"player",fpx-cx,fpy-cy,P.dir,P.moving,t)});
  spr.push({y:BYT.y*T+T+2,f:()=>byteSprite(g,t,cx,cy,bmv)});
  const ws=wardenSheet();
  spr.push({y:28*T+T,f:()=>{
    if(ws)actorHi(g,"warden",10*T-cx,28*T-cy,3,false,t,{tag:"RANGER",sheet:ws});
    if(!q.on)iconHi(g,7,0,10*T+16-cx,28*T-44-cy+Math.sin(t/260)*3,22)
  }});
  if(M[13][39]==="N")spr.push({y:13*T+T,f:()=>actor(g,"nullo",39*T-cx,13*T-cy,0,false,t,{tag:"NULLO"})});
  const drawP=(i,pcx,by,w,alpha)=>{
    const r=FR.props[i],dw=w*T,kk=dw/r[2],dh=r[3]*kk,dx=pcx*T-dw/2-cx,dy=(by+1)*T-dh-cy+3;
    if(dx>VWp||dx+dw<0||dy>VHp||dy+dh<0)return;
    const ov=alpha&&!(dx>pbox[0]+pbox[2]||dx+dw<pbox[0]||dy>pbox[1]+pbox[3]||dy+dh<pbox[1]);
    g.imageSmoothingEnabled=true;
    if(ov)g.globalAlpha=.45;
    g.drawImage(FI.props,r[0],r[1],r[2],r[3],dx,dy,dw,dh);
    g.globalAlpha=1
  };
  TREES.forEach(tr=>{
    const by=tr.by;
    if((by+1)*T<cy-40||(by-3)*T>cy+VHp)return;
    spr.push({y:(by+1)*T,f:()=>drawP(tr.i,tr.cx,by,tr.w,(by+1)*T>fpy+T)})
  });
  SPOTS.forEach(sp=>{
    const i={hut:8,lantern:q.lantern?13:12,relay:q.relay?13:12,bridgectl:7,gate:gateOpen()?11:10,compiler:q.done?13:12,chest:q.chest?15:14,exitgate:q.done?11:10}[sp.id];
    spr.push({y:(sp.by+1)*T,f:()=>{
      drawP(i,sp.cx,sp.by,sp.w,false);
      const top=(sp.by+1)*T-cy-FR.props[i][3]*(sp.w*T/FR.props[i][2])+Math.sin(t/300)*2;
      if(sp.id==="gate"&&!gateOpen())iconHi(g,7,3,sp.cx*T-cx,top-6,22);
      if(sp.id==="chest"&&!q.chest&&q.bridge)iconHi(g,7,0,sp.cx*T-cx,top-4,16);
      if((sp.id==="lantern"&&q.lantern)||(sp.id==="relay"&&q.relay)||(sp.id==="compiler"&&q.done)){
        g.globalAlpha=.5+.2*Math.sin(t/400);
        iconHi(g,4,0,sp.cx*T-cx,(sp.by-.9)*T-cy,80);
        g.globalAlpha=1
      }
    }})
  });
  // corruption writhing around what is still broken
  const corr=[];
  if(!q.done)corr.push([38.3,7.4],[43.3,7.2],[41.4,9.1],[39.0,4.6],[43.8,4.4]);
  if(!q.relay)corr.push([13.5,11.4],[12.5,10.5],[14.7,10.8]);
  corr.forEach((p,j)=>spr.push({y:p[1]*T+T+50,f:()=>{
    const fr=Math.floor(t/120+j*2)%8,r=FR.effects[3*8+fr],s=62/Math.max(r[2],r[3]);
    g.drawImage(FI.effects,r[0],r[1],r[2],r[3],p[0]*T-r[2]*s/2-cx,p[1]*T-r[3]*s/2-cy,r[2]*s,r[3]*s)
  }}));
  if(FX.restore&&now-FX.restore.t0<1200){
    const fr=Math.min(7,Math.floor((now-FX.restore.t0)/140));
    spr.push({y:99999,f:()=>{
      const r=FR.effects[4*8+fr],s=320/Math.max(r[2],r[3]);
      g.drawImage(FI.effects,r[0],r[1],r[2],r[3],40.5*T-r[2]*s/2-cx,6*T-r[3]*s/2-cy,r[2]*s,r[3]*s)
    }})
  }
  spr.sort((a,b)=>a.y-b.y).forEach(s=>s.f());
  // drifting fireflies: more once the forest is healed
  const nf=q.done?34:14;
  for(let i=0;i<nf;i++){
    const wx=(hash(i,31)*FW*T+Math.sin(t/1400+i*1.9)*20+t*.004*(1+hash(i,3)))%(FW*T),wy=(hash(i,32)*FH*T+Math.cos(t/1100+i*2.3)*14)%(FH*T);
    const sx=wx-cx,sy=wy-cy;
    if(sx<-30||sy<-30||sx>VWp+30||sy>VHp+30)continue;
    const fr=Math.floor(t/110+i*3)%8,r=FR.effects[fr],s=(q.done?15:10)/Math.max(r[2],r[3]);
    g.globalAlpha=.9;
    g.drawImage(FI.effects,r[0],r[1],r[2],r[3],sx-r[2]*s/2,sy-r[3]*s/2,r[2]*s,r[3]*s);
    g.globalAlpha=1
  }
  if(flash>0&&!REDUCE){
    g.fillStyle=`rgba(255,255,255,${Math.min(1,flash/300)})`;
    g.fillRect(0,0,VWp,VHp)
  }
}
