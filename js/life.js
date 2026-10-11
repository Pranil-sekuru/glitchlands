// Live layers over the painted map. No changes to the painting or terrain grid.
const LIFE={people:[],door:null,doorImage:null,areaKey:'',areaAt:0,zone:'',zoneSince:0};
const LIVE_DOORS=[
 {id:'home',row:0,x:18.22,y:6.91,w:.55},
 {id:'lab',row:1,x:3.96,y:4.02,w:.62},
 {id:'cottage',row:2,x:14.58,y:5.04,w:.5}
];
const doorArt=new Image();
doorArt.onload=()=>LIFE.doorImage=doorArt;
doorArt.onerror=()=>console.warn('Door animation art unavailable; travel still works.');
doorArt.src='assets/meadow/door-animation.png';
const area=document.createElement('div');
area.id='area-title';area.setAttribute('role','status');area.setAttribute('aria-live','polite');
const areaName=document.createElement('strong'),areaSub=document.createElement('span');
area.append(areaName,areaSub);screenBox.append(area);
function announceArea(name,subtitle=''){
 LIFE.areaAt=performance.now();areaName.textContent=name;areaSub.textContent=subtitle;
 area.classList.remove('arriving');void area.offsetWidth;area.classList.add('arriving');
}
function regionTitle(n){
 const labels={0:['HOME','A new day'],1:['MEADOW MAINFRAME','The village of the Great Compiler'],2:['SYNTAX FOREST','Beyond the meadow'],
  'interior:home':['HOME','A new day'],'interior:lab':["SEMICOLON'S LAB",'Meadow Mainframe'],'interior:cottage':["VILLAGER'S COTTAGE",'Meadow Mainframe']};
 if(LIFE.areaKey===String(n))return;
 LIFE.areaKey=String(n);LIFE.zone='';LIFE.zoneSince=0;
 announceArea(...(labels[n]||['GLITCHLANDS','']));
}
function resetVillagePeople(){
 const routes=[[[14,6],[14,7]],[[13,7],[13,6],[12,6],[12,7]],[[12,7],[11,7],[11,6],[12,6]],[[11,14]]];
 LIFE.people=VILLAGERS.map((v,i)=>({x:i===3?11.5:v[0],y:i===3?14.95:v[1],dir:v[2],look:v[3],route:routes[i],target:0,wait:900+i*610,moving:false,frame:0}));
}
resetVillagePeople();
function personTile(p){return [Math.floor(p.x),Math.floor(p.y-.05)];}
function villagerOccupies(x,y,exclude){
 return REG===1&&LIFE.people.some(p=>p!==exclude&&((personTile(p)[0]===x&&personTile(p)[1]===y)||(p.moving&&p.route[p.target][0]===x&&p.route[p.target][1]===y)));
}
function villageTalk(){
 if(REG!==1)return false;
 const d=DIRS[P.dir],near=p=>{const dx=p.x-P.px,dy=p.y-PHYS.feet-P.py,l=Math.hypot(dx,dy);return l<1.35&&(dx*d[0]+dy*d[1])/(l||1)>.5;};
 const p=LIFE.people.filter(near).sort((a,b)=>Math.hypot(a.x-P.px,a.y-P.py)-Math.hypot(b.x-P.px,b.y-P.py))[0];
 if(!p)return false;
 p.dir=(P.dir+2)%4;p.wait=2400;
 say(['VILLAGER: '+['Compare Expected with Got. Every Bug leaves a clue.','The pump, the bell and the lantern all need a Debugger.','I take this walk every morning. The village feels brighter already.','The stream keeps flowing, even when our programs get stuck.'][LIFE.people.indexOf(p)]]);
 return true;
}
function advanceVillage(dt,t){
 if(REG!==1||mode!=='walk')return;
 LIFE.people.forEach((p,i)=>{
  p.moving=false;
  if(p.wait>0){p.wait-=dt;return;}
  if(p.route.length===1){p.dir=(Math.floor(t/2400)+i)%4;p.wait=2000;return;}
  const [tx,ty]=p.route[p.target],x=tx+.5,y=ty+.95;
  const cell=(M[ty]||[])[tx],occupied=(P.x===tx&&P.y===ty)||(P.moving&&P.nx===tx&&P.ny===ty)||villagerOccupies(tx,ty,p);
  // V is an original stationary NPC marker, so it is safe for its live replacement.
  if(!cell||(SOLID.has(cell)&&cell!=='V')||occupied){p.wait=400;return;}
  const dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy),step=dt*.00085;
  if(d<=step){p.x=x;p.y=y;p.target=(p.target+1)%p.route.length;p.wait=1300+i*180;return;}
  p.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
  p.x+=dx/d*step;p.y+=dy/d*step;p.moving=true;p.frame+=dt;
 });
 const zone=P.x>=25&&P.y<=10?'Compiler Hill':P.x<=9&&P.y>=12&&P.y<=18?'Willow Creek':P.x>=11&&P.y>=10?'Tallgrass Meadow':P.x>=10&&P.x<=15&&P.y<=9?'Village Square':'';
 if(zone!==LIFE.zone){LIFE.zone=zone;LIFE.zoneSince=t;}
 if(zone&&t-LIFE.zoneSince>650&&t-LIFE.areaAt>8000&&areaName.textContent!==zone)announceArea(zone,'MEADOW MAINFRAME');
}
function beginDoorTravel(id,travel){
 if(LIFE.door&&LIFE.door.stage==='opening')return;
 LIFE.door={id,stage:'opening',at:performance.now(),travel};
 mode='door';Object.keys(keys).forEach(k=>delete keys[k]);
}
function updateDoorTravel(t){
 const d=LIFE.door;if(!d)return;
 const duration=REDUCE?100:560;
 if(d.stage==='opening'&&t-d.at>=duration){
  d.stage='closing';d.at=t;mode='walk';d.travel();
 }else if(d.stage==='closing'&&t-d.at>=duration)LIFE.door=null;
}
function doorProgress(id,t){
 const d=LIFE.door;
 if(d&&d.id===id){const p=Math.min(1,(t-d.at)/(REDUCE?100:560));return d.stage==='opening'?p:1-p;}
 return 0;
}
function drawDoor(c,row,x,y,width,p){
 const img=LIFE.doorImage;if(!img)return;
 const cw=img.width/4,ch=img.height/4,frame=Math.min(3,Math.floor(p*3.999));
 const h=width; // equal source cells preserve the doorway's fixed registration
 c.drawImage(img,frame*cw,row*ch,cw,ch,x-width/2,y-h,width,h);
}
function drawVillageDoors(t,cx,cy){
 if(!LIFE.doorImage)return;
 LIVE_DOORS.forEach(d=>{
  const p=doorProgress(d.id,t);
  // Closed states align with the painted doors. The original door stays untouched otherwise.
  if(p>0)drawDoor(g,d.row,d.x*T-cx,d.y*T-cy,d.w*T*1.5,p);
 });
}
function drawHomeDoor(t,cx,cy){
 const p=doorProgress('home',t);
 if(p>0)drawDoor(g,0,5*T-cx,7.6*T-cy,1.15*T,p);
}
// Ambient layers are subtle, time-based and never alter map collision.
function drawVillageAmbient(t,cx,cy,VWp,VHp){
 if(REDUCE)return;
 g.save();
 // Chimney smoke curls above the laboratory, independent of repair progress.
 for(let i=0;i<8;i++){
  const age=((t/3200+i/8)%1),x=(2.42+Math.sin(age*5+i)*.14)*T-cx,y=(1.07-age*1.6)*T-cy;
  g.globalAlpha=(1-age)*.22;g.fillStyle='#e4eee7';g.beginPath();g.ellipse(x,y,2+age*5,2+age*3,0,0,7);g.fill();
 }
 // Ripples sit only on water cells and use a different phase at each point.
 for(let y=0;y<REG1.H;y++)for(let x=0;x<REG1.W;x++){
  if(REG1.M[y][x]!=='~'||hash(x,y,151)>.38)continue;
  const sx=(x+.5)*T-cx,sy=(y+.5)*T-cy;
  if(sx<-T||sy<-T||sx>VWp+T||sy>VHp+T)continue;
  const phase=(t/2200+hash(x,y,152))%1;
  g.globalAlpha=Math.sin(phase*Math.PI)*.26;g.strokeStyle='#d2f4df';g.lineWidth=.65;
  g.beginPath();g.ellipse(sx,sy,3+phase*11,1+phase*3,0,0,Math.PI*2);g.stroke();
 }
 // Fern tips and grass breathe in the breeze, drawn from the existing transparent atlas.
 const plants=[[6.7,9.8,7],[10.8,10.5,9],[16.6,10.8,7],[23.4,16.2,9],[8.5,16.7,7]];
 if(MI.env)plants.forEach(([x,y,index],i)=>{
  const r=MR.env[index],w=23,h=w*r[3]/r[2];g.save();g.globalAlpha=.9;
  g.translate(x*T-cx,y*T-cy);g.rotate(Math.sin(t/1700+i*1.8)*.045);
  g.drawImage(MI.env,r[0],r[1],r[2],r[3],-w/2,-h,w,h);g.restore();
 });
 g.restore();
}
