// house.js: Interiors (region 0): your two-storey home, Prof. Semicolon's lab and the villager's cottage
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// Every room has a two-row back wall (rows 0-1); the lab and cottage layouts from the kit are shifted down one row for it.
// Every interior lives in region 0 with its own room id (S.pos.room), so outdoor levels keep their numbers (1, 2, a future 3).
// Art: assets/interiors/ (generated kit; layouts follow interior-layouts.json). Furniture collides by its footprint cells,
// never by its picture. Grid letters: W wall  O door out (step on it)  U stairs up  Z stairs down  . floor  r rug (walkable)
// Q bed  k bookcase  c computer  J table  M Mom  p fern  K cabinet  e stove  n chair  F other furniture
const FURN={bed:[82,38,220,299],bookcase:[388,13,215,322],"writing-desk":[675,84,233,251],stool:[1024,164,145,172],"dining-table":[28,429,354,226],
 chair:[438,383,134,266],"kitchen-cabinet":[661,401,261,246],stove:[976,366,243,288],"lab-workbench":[35,679,445,258],computer:[515,711,151,226],
 lectern:[725,685,220,260],"specimen-dome":[1032,680,159,266],window:[38,974,299,240],"exit-door":[393,958,216,261],fern:[676,982,251,240],rug:[957,1031,265,166]};
const TEXN=["oak-horizontal","oak-vertical","stone-small","slate-lab","plaster-beamed","plaster-plain","stone-wall","timber-wall","oak-light","sage-kitchen","stone-cream","oak-dark","wood-baseboard","wood-cap","stone-base","stone-cap"];
const INT={furn:null,tex:null};
[["furn","interior-furniture.png"],["tex","interior-textures.png"]].forEach(([k,f])=>{
  const i=new Image();
  i.onload=()=>INT[k]=i;
  i.onerror=()=>console.error("missing art: assets/interiors/"+f);
  i.src="assets/interiors/"+f
});
// a placement: [asset, footprint x, y, w, h, feet x, feet y, draw width in tiles, solid]
const ROOMS={
 "home-up":{title:"HOME",sub:"Upstairs",key:"home",floor:"oak-horizontal",wall:"plaster-beamed",base:"wood-baseboard",
  grid:["WWWWWWWWWW",
   "WWWWWWWWWW",
   "WQ.kk..cZW",
   "WQ.......W",
   "W...rr...W",
   "Wp......pW",
   "WWWWWWWWWW"],
  inside:[2,3],stairs:{Z:{to:"home-down",at:[8,3],dir:2}},
  windows:[[5.7,2,1.5]],
  place:[["bed",1,2,1,2,1.5,3.95,1.6,1],["bookcase",3,2,2,1,4,2.95,1.8,1],["computer",7,2,1,1,7.5,2.95,1.1,1],["rug",4,4,2,1,5,4.95,2,0],
   ["fern",1,5,1,1,1.5,5.95,.85,1],["fern",8,5,1,1,8.5,5.95,.85,1]],
  talk:{bed:["Your bed. No time for a nap: adventure awaits!"],bookcase:["The bookshelf: 'Bugs and Where to Find Them', 'Python by the River', 'Lua and the Moon', 'JavaScript for Beetles'."],
   computer:["Your computer. Three windows are open:","console.log(\"Hello!\")   ·   print(\"Hello!\")   ·   print(\"Hello!\")","JavaScript, Python and Lua. Every language says hello in its own way."],
   fern:["A fern. It has never had a single bug."],window:["Through the window: the village square, and far to the north-west, the Prof's lab on the hill."]}},
 "home-down":{title:"HOME",sub:"A new day",key:"home",floor:"oak-horizontal",wall:"plaster-beamed",base:"wood-baseboard",door:{id:"home",row:0,out:[18,7],dir:2},
  grid:["WWWWWWWWWW",
   "WWWWWWWWWW",
   "WKKe....UW",
   "W........W",
   "W...JJ..pW",
   "W..nJJM..W",
   "Wp..rr...W",
   "WWWWOOWWWW"],
  inside:[4,6],stairs:{U:{to:"home-up",at:[8,3],dir:2}},
  windows:[[6,2,1.5]],
  place:[["kitchen-cabinet",1,2,2,1,2,2.95,1.9,1],["stove",3,2,1,1,3.5,2.95,1.2,1],["dining-table",4,4,2,2,5,5.95,2,1],["chair",3,5,1,1,3.55,5.9,.72,1],
   ["fern",8,4,1,1,8.5,4.95,.85,1],["fern",1,6,1,1,1.5,6.95,.85,1],["rug",4,6,2,1,5,6.95,2,0]],
  talk:{"kitchen-cabinet":["The kitchen cabinet. Mom labels every jar: SUGAR, SALT, and one that just says SEMICOLONS."],stove:["The stove is cold. Breakfast is long finished."],
   "dining-table":["A bowl of apples on the table. One is labelled apples[0]. Lua would call the same apple apples[1]."],chair:["Your chair. It wobbles: an off-by-one leg."],
   fern:["A fern. It has never had a single bug."],window:["Through the window: the village square and the tall grass beyond it."]}},
 lab:{title:"SEMICOLON'S LAB",sub:"Meadow Mainframe",key:"lab",floor:"slate-lab",wall:"stone-wall",base:"stone-base",door:{id:"lab",row:1,out:[3,4],dir:2},
  grid:["WWWWWWWWWWWWWW",
   "WWWWWWWWWWWWWW",
   "W.FFF.....FF.W",
   "W............W",
   "W.FFFF..F.F..W",
   "W.FFFF.......W",
   "W......F..F..W",
   "W............W",
   "WF...........W",
   "W............W",
   "WWWWWWOOWWWWWW"],
  inside:[6,9],windows:[[7,2,1.6]],
  place:[["bookcase",2,2,3,1,3.5,2.95,1.9,1],["kitchen-cabinet",10,2,2,1,11,2.95,1.8,1],["lab-workbench",2,4,4,2,4,5.95,3.7,1],["computer",8,4,1,1,8.5,4.95,1,1],
   ["lectern",10,4,1,1,10.5,4.95,1,1],["specimen-dome",10,6,1,1,10.5,6.95,1,1],["stool",7,6,1,1,7.5,6.95,.75,1],["fern",1,8,1,1,1.5,8.95,.9,1],["rug",6,8,2,1,7,8.95,2,0]],
  talk:{bookcase:["The Prof's books: 'Off-by-One: A Love Story', 'Infinite Loops and How to Leave Them', 'Lua for Night Owls'."],
   "kitchen-cabinet":["Jars of spare parts: BRACKETS, QUOTES, and a nearly empty jar of SEMICOLONS. He goes through a lot of those."],
   "lab-workbench":["Brass instruments, a Bug net under repair, and a note in the Prof's handwriting:","'Bugs are just misunderstandings. Read them, and they stop biting.'"],
   computer:["The lab computer runs all three languages at once. A test suite scrolls by: every check green."],
   lectern:["The Prof's notebook is open at: 'A partner who speaks the Bug's language sees what you can't. Recruit widely.'"],
   "specimen-dome":["A Bug sleeps under a glass dome. The label says: 'Offbyonyx (tame). Counts to ten as 0 to 9.'"],
   stool:["A tall lab stool, polished by years of thinking."],fern:["A fern. Even the Prof's plants look tidy."],window:["Through the window: the stairs down to the village."]}},
 cottage:{title:"VILLAGER'S COTTAGE",sub:"Meadow Mainframe",key:"cottage",floor:"oak-light",wall:"plaster-plain",base:"wood-baseboard",door:{id:"cottage",row:2,out:[14,5],dir:2},
  grid:["WWWWWWWWW",
   "WWWWWWWWW",
   "W.....FFW",
   "WF....FFW",
   "WFFF....W",
   "W.FF....W",
   "W......FW",
   "W.......W",
   "WWWWOOWWW"],
  inside:[4,7],windows:[[4.5,2,1.5]],
  place:[["bed",1,3,1,2,1.5,4.95,1.6,1],["bookcase",6,2,2,1,7,2.95,1.5,1],["dining-table",2,4,2,2,3,5.95,2,1],["stove",7,3,1,1,7.5,3.95,1.25,1],
   ["kitchen-cabinet",6,3,1,1,6.5,3.95,1,1],["fern",7,6,1,1,7.5,6.95,.8,1],["rug",4,6,2,1,5,6.95,2,0]],
  talk:{bed:["A neatly made bed with a patchwork quilt."],bookcase:["Recipe books, a almanac of the Meadow Mainframe, and 'Bugs I Have Known' (volume 3)."],
   "dining-table":["Two bowls set out. Someone is expecting company."],stove:["The stove is cold. A pot of soup waits for supper."],
   "kitchen-cabinet":["Tea, honey and a tin marked BISCUITS (SORTED, ASCENDING)."],fern:["A fern, watered exactly on time."],window:["Through the window: the village square."]}}};
let ROOM="home-down";
// region 0's grid is the current room (setRegion(0) reads M, W and H from here)
const REG0={M:[],W:10,H:8,bed:[2,3],inside:[4,6]};
const MOM_AT=[6.5,5.95];   // feet, in tiles (downstairs)
function setRoom(id){
  if(!ROOMS[id])id="home-down";
  ROOM=id;
  const r=ROOMS[id];
  r.M=r.M||r.grid.map(row=>row.split(""));
  REG0.M=r.M;
  REG0.W=r.grid[0].length;
  REG0.H=r.grid.length;
  REG0.inside=r.inside||[4,6]
}
setRoom("home-down");
const roomKey=()=>"interior:"+ROOMS[ROOM].key;
// ---------- travel ----------
function enterRoom(id,at,dir){
  flash=250;
  setRoom(id);
  setRegion(0);
  const r=ROOMS[id],p=at||r.inside;
  placeAt(p[0],p[1],dir==null?0:dir);
  S.pos={r:0,room:id,x:P.x,y:P.y};
  save();
  hud();
  plog("region",{r:0,room:id})
}
function enterHouse(){
  enterRoom("home-down")
}
function leaveRoom(){
  const r=ROOMS[ROOM],d=r.door||ROOMS["home-down"].door,home=r.key==="home";
  flash=250;
  setRegion(1);
  placeAt(d.out[0],d.out[1],d.dir);
  S.pos={r:1,x:P.x,y:P.y};
  const first=home&&!S.leftHome;
  if(home)S.leftHome=true;
  save();
  hud();
  plog("region",{r:1});
  if(first&&!S.starter)say(["The village of the Meadow Mainframe. Glitchy colours flicker everywhere.","Prof. Semicolon's lab is on the hill in the north-west: follow the path west through the square, then north."])
}
const leaveHouse=leaveRoom;
function takeStairs(s){
  // up or down the stairs: a quick fade, no door
  flash=200;
  setRoom(s.to);
  setRegion(0);
  placeAt(s.at[0],s.at[1],s.dir);
  S.pos={r:0,room:s.to,x:P.x,y:P.y};
  save();
  hud();
  plog("stairs",{to:s.to})
}
// stepping onto a tile indoors (called from landed())
function roomLanded(c){
  const r=ROOMS[ROOM];
  if(c==="O"&&r.door){
    beginDoorTravel(r.door.id,leaveRoom);
    return
  }
  if(r.stairs&&r.stairs[c])takeStairs(r.stairs[c])
}
// ---------- talking ----------
function momTalk(){
  if(!S.starter)say(["MOM: Morning, sleepyhead! Prof. Semicolon came by. He has a partner waiting for you at his lab.","MOM: Each partner speaks a different programming language, so choose the one you'd like to learn first.","MOM: His lab is up on the hill in the north-west. The door is behind you. Off you go!"]);
  else say(["MOM: Oh, look at "+petName(S.starter)+"! Hello there, little one.",S.team.length<3?"MOM: Catch Bugs in other languages and new partners will join you. A Debugger who speaks many languages is never stuck.":"MOM: Three partners and three languages! I'm so proud of you."])
}
function placementAt(x,y){
  return ROOMS[ROOM].place.find(p=>p[8]&&x>=p[1]&&x<p[1]+p[3]&&y>=p[2]&&y<p[2]+p[4])
}
function interactHouse(){
  const who=npcInFront();
  if(who){
    talkNPC(who);
    return
  }
  const r=ROOMS[ROOM],{nx,ny,c}=facingTile();
  if(c==="M"){
    momTalk();
    return
  }
  if(c==="U"||c==="Z"){
    say([c==="U"?"The stairs up to your room.":"The stairs down to the kitchen."]);
    return
  }
  const p=placementAt(nx,ny);
  if(p&&r.talk[p[0]]){
    say(r.talk[p[0]]);
    return
  }
  if(c==="W"&&ny<=1&&r.windows.some(w=>Math.abs(w[0]-(nx+.5))<1.1)){
    say(r.talk.window||["Through the window: the Meadow Mainframe."]);
    return
  }
}
// ---------- drawing: textured floor and walls, windows, stairs, furniture and people depth-sorted by their feet ----------
function texTile(name,dx,dy,dw,dh){
  // one swatch per tile, cropped 2 px inside the cell so neighbouring swatches never bleed in
  const i=TEXN.indexOf(name),cw=1254/4,sx=(i%4)*cw+2,sy=Math.floor(i/4)*cw+2,s=cw-4;
  g.drawImage(INT.tex,sx,sy,s,s*(dh/dw>1?1:dh/dw),dx,dy,dw,dh)
}
function furn(name,feetX,feetY,wTiles,cx,cy){
  const r=FURN[name],dw=wTiles*T,dh=dw*r[3]/r[2];
  g.drawImage(INT.furn,r[0],r[1],r[2],r[3],feetX*T-dw/2-cx,feetY*T-dh-cy,dw,dh)
}
function drawStairs(c,x,y,cx,cy,t){
  // up: wooden steps climbing the back wall, each tread lit on top with a dark riser under it, a banister on the left.
  // down: a stairwell cut into the floor, the steps sinking into the dark towards the wall.
  const X=x*T-cx,up=c==="U",n=up?7:5,top=up?.25*T-cy:y*T-cy,bot=(y+1)*T-cy,h=bot-top,step=h/n;
  g.fillStyle=up?"#3b2616":"#0f0a06";
  g.fillRect(X+1,top,T-2,h);
  for(let i=0;i<n;i++){
    // i = 0 is the step nearest you (the bottom of the tile)
    const sy=bot-(i+1)*step,k=i/n,shade=up?1-k*.45:1-k*.85,inset=up?k*3:0;
    g.fillStyle=`rgb(${Math.round(176*shade)},${Math.round(122*shade)},${Math.round(72*shade)})`;
    g.fillRect(X+3+inset,sy,T-6-2*inset,step*.62);
    g.fillStyle=`rgba(0,0,0,${up?.45:.6})`;
    g.fillRect(X+3+inset,sy+step*.62,T-6-2*inset,step*.38)
  }
  // banister (up) or a railing around the stairwell (down)
  g.strokeStyle="#6b4428";
  g.lineWidth=2.5;
  g.beginPath();
  if(up){
    g.moveTo(X+2.5,bot-2);
    g.lineTo(X+5,top+4)
  }else{
    g.moveTo(X+1.5,bot-1);
    g.lineTo(X+1.5,top+1);
    g.lineTo(X+T-1.5,top+1)
  }
  g.stroke();
  g.fillStyle="#8a5a34";
  if(up)for(let i=0;i<4;i++)g.fillRect(X+1.5+i*.8,bot-4-i*(h-8)/3,2.5,4);
  else g.fillRect(X,bot-4,3,4);
}
function drawHouse(t,dt,cx,cy,VWp,VHp,fpx,fpy){
  const r=ROOMS[ROOM],G=r.M,w=G[0].length,h=G.length;
  if(!INT.tex||!INT.furn){
    g.fillStyle="#2a1f18";
    g.fillRect(-cx,-cy,w*T,h*T)
  }else{
    g.imageSmoothingEnabled=true;
    g.imageSmoothingQuality="high";
    // floor under everything that isn't the back wall (the side and front walls are drawn on top);
    // one swatch covers 2x2 tiles, so the planks are a believable size and the repeat is hard to spot
    g.save();
    g.beginPath();
    g.rect(-cx,2*T-cy,w*T,(h-2)*T);
    g.clip();
    for(let y=2;y<h;y+=2)for(let x=0;x<w;x+=2)texTile(r.floor,x*T-cx,y*T-cy,2*T+.5,2*T+.5);
    g.restore();
    // back wall: two rows of wall surface, a cap on top and a baseboard at the floor
    for(let x=0;x<w;x++){
      texTile(r.wall,x*T-cx,-cy,T,T);
      texTile(r.wall,x*T-cx,T-cy,T,T);
      texTile(r.base,x*T-cx,1.72*T-cy,T,.28*T)
    }
    g.fillStyle="rgba(0,0,0,.22)";
    g.fillRect(-cx,2*T-cy,w*T,4);   // the wall's shadow on the floor
    r.windows.forEach(([wx,wy,ww])=>furn("window",wx,wy,ww,cx,cy));
    // side and front walls: dark wall tops, so the room reads as seen from above
    const top="#3b2a3d",lip="#5a4060";
    g.fillStyle=top;
    for(let y=2;y<h;y++){
      g.fillRect(-cx,y*T-cy,T,T);
      g.fillRect((w-1)*T-cx,y*T-cy,T,T)
    }
    for(let x=0;x<w;x++)if(G[h-1][x]==="W"){
      g.fillStyle=top;
      g.fillRect(x*T-cx,(h-1)*T-cy,T,T);
      g.fillStyle=lip;
      g.fillRect(x*T-cx,(h-1)*T-cy,T,4)
    }
    // the doorway out: daylight through the opening, then the static frame
    for(let x=0;x<w;x++)if(G[h-1][x]==="O"){
      const day=g.createLinearGradient(0,(h-1)*T-cy,0,h*T-cy);
      day.addColorStop(0,"#f5e6b8");
      day.addColorStop(1,"#9fd27a");
      g.fillStyle=day;
      g.fillRect(x*T-cx,(h-1)*T-cy,T,T)
    }
    // stairs
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(G[y][x]==="U"||G[y][x]==="Z")drawStairs(G[y][x],x,y,cx,cy,t);
    // rugs lie flat under everything
    r.place.forEach(p=>{
      if(!p[8])furn(p[0],p[5],p[6],p[7],cx,cy)
    })
  }
  // furniture, you, your partner and anyone home, depth-sorted by feet
  const bmv=S.starter?followByte(dt):false,spr=[];
  if(INT.furn)r.place.forEach(p=>{
    if(p[8])spr.push({y:p[6]*T,f:()=>{
      furn(p[0],p[5],p[6],p[7],cx,cy);
      // a little life: the computer screen glows, the specimen dome breathes
      if(!REDUCE&&(p[0]==="computer"||p[0]==="specimen-dome")){
        g.globalAlpha=.18+.1*Math.sin(t/(p[0]==="computer"?300:900));
        g.fillStyle=p[0]==="computer"?"#7dffb2":"#b6ff8a";
        g.beginPath();
        g.ellipse(p[5]*T-cx,(p[6]-p[7]*.9)*T-cy,p[7]*T*.42,p[7]*T*.3,0,0,7);
        g.fill();
        g.globalAlpha=1
      }
    }})
  });
  spr.push({y:fpy+T,f:()=>actor(g,"player",fpx-cx,fpy-cy,P.dir,P.moving,t)});
  if(S.starter)spr.push({y:BYT.y*T+T+2,f:()=>byteSprite(g,t,cx,cy,bmv)});
  drawNPCs(spr,t,cx,cy);
  spr.sort((a,b)=>a.y-b.y).forEach(s=>s.f());
  if(flash>0&&!REDUCE){
    g.fillStyle=`rgba(0,0,0,${Math.min(1,flash/250)})`;
    g.fillRect(0,0,VWp,VHp)
  }
}
// the door swinging open and shut (life.js's door atlas: home row 0, lab row 1, cottage row 2)
function drawRoomDoor(t,cx,cy){
  const r=ROOMS[ROOM],d=r.door;
  if(!d)return;
  const p=doorProgress(d.id,t);
  if(p<=0)return;
  const G=r.M,h=G.length,xs=[];
  G[h-1].forEach((ch,x)=>{
    if(ch==="O")xs.push(x)
  });
  if(xs.length)drawDoor(g,d.row,(xs[0]+xs.length/2)*T-cx,(h-.4)*T-cy,1.15*T,p)
}
