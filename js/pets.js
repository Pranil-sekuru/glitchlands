// pets.js: Partners. Each one speaks one programming language; the team, the follower, the starter choice at the lab
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- the three partners: byte-beetles from player-byte.png, recoloured per language ----------
// body: the hue the golden body turns into; shell: the green wing-case's new [hue, saturation, lightness factor] (null keeps it)
const PETS={
 js:{name:"BYTE",lang:"js",icon:"🟨",body:null,shell:null,
  blurb:"Quick and bright. Speaks JavaScript, the language every web browser understands."},
 py:{name:"PIP",lang:"py",icon:"🐍",body:205,shell:[48,.85,1.1],
  blurb:"Calm and tidy. Speaks Python, loved for code that reads almost like English."},
 lua:{name:"LUNA",lang:"lua",icon:"🌙",body:258,shell:[220,.12,1.25],
  blurb:"Small and clever. Speaks Lua (Portuguese for 'moon'), the language inside many games."}};
const PET_ORDER=["js","py","lua"];
function petSheet(lang){
  const p=PETS[lang];
  if(!p||!MI.pb)return null;
  if(p.body==null)return MI.pb;
  return recolor("pet:"+lang,MI.pb,(h,s,l)=>{
    if(h>=20&&h<=75&&s>.18)return [p.body,Math.min(1,s*1.05),l];                                    // golden body and antennae
    if(p.shell&&h>=140&&h<=200&&s>.12)return [p.shell[0],Math.min(1,s*p.shell[1]+.05),Math.min(.92,l*p.shell[2])];   // green wing-case
    return null
  })
}
const petName=l=>PETS[l]?PETS[l].name:"?";
const langName=l=>(LANGS[l]||LANGS.js).name;
const hasPartner=l=>S.team.includes(l);
// one frame of a partner (dir: 0 up, 1 right, 2 down, 3 left), feet at (cx, by), h pixels tall
function petFrame(c,lang,cx,by,h,dir,t,moving,dim){
  const img=petSheet(lang);
  if(!img)return;
  const frame=moving?Math.floor(t/85)%8:0,r=MR.pb[(4+FROW[dir])*8+frame],k=h/r[3],bob=moving?0:Math.sin(t/420)*h*.02;
  c.save();
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality="high";
  if(dim)c.globalAlpha=.35;
  c.drawImage(img,r[0],r[1],r[2],r[3],cx-r[2]*k/2,by-r[3]*k+bob,r[2]*k,r[3]*k);
  c.restore()
}
// a small portrait (data URL) for the HUD, the team screen and the result card; a dark silhouette while locked
function petThumb(lang,locked){
  const key="pt:"+lang+(locked?":x":"");
  if(CC[key])return CC[key];
  if(!MI.pb)return "";
  const o=document.createElement("canvas");
  o.width=o.height=64;
  const c=o.getContext("2d");
  petFrame(c,lang,32,60,52,2,0,false);
  if(locked){
    c.globalCompositeOperation="source-in";
    c.fillStyle="#0b1a14";
    c.fillRect(0,0,64,64)
  }
  return CC[key]=o.toDataURL()
}
// ---------- joining the team ----------
function recruit(lang){
  if(!PETS[lang]||hasPartner(lang))return false;
  S.team.push(lang);
  save();
  hud();
  return true
}
// ---------- the starter choice (an overlay inside the game screen) ----------
let pickI=0,pickArmed=false,pickDone=null;
function openStarter(after){
  mode="starter";
  pickI=0;
  pickArmed=false;
  pickDone=after;
  $("pets").innerHTML=PET_ORDER.map((l,i)=>`<div class="pet" role="radio" tabindex="0" data-i="${i}" style="--c:${LANGS[l].color};--ink:${LANGS[l].ink}">
   <canvas width="160" height="160" aria-hidden="true"></canvas><b>${PETS[l].name}</b><span class="lt">${PETS[l].icon} ${LANGS[l].name.toUpperCase()}</span></div>`).join("");
  $("starter").classList.add("on");
  paintStarter();
  const first=$("pets").querySelector(".pet");
  first&&first.focus({preventScroll:true})
}
function paintStarter(){
  const l=PET_ORDER[pickI];
  [...$("pets").children].forEach((d,i)=>{
    d.classList.toggle("cur",i===pickI);
    d.setAttribute("aria-checked",i===pickI)
  });
  $("petsay").textContent=PETS[l].name+": "+PETS[l].blurb+(pickArmed?"  Press A (Enter) again to choose "+PETS[l].name+".":"");
  $("petgo").textContent=pickArmed?"YES, "+PETS[l].name+"! ▶":"CHOOSE "+PETS[l].name+" ▶"
}
function starterFrame(t){
  // the three partners bob on their cards; the highlighted one walks on the spot
  [...$("pets").querySelectorAll("canvas")].forEach((cv2,i)=>{
    const c=cv2.getContext("2d");
    c.clearRect(0,0,160,160);
    c.fillStyle="rgba(0,0,0,.25)";
    c.beginPath();
    c.ellipse(80,142,38,8,0,0,7);
    c.fill();
    petFrame(c,PET_ORDER[i],80,144,118,2,t,i===pickI)
  })
}
function starterKey(k){
  if(k==="arrowleft"||k==="a"||k==="arrowup"||k==="w"){
    pickI=(pickI+2)%3;
    pickArmed=false;
    paintStarter()
  }else if(k==="arrowright"||k==="d"||k==="arrowdown"||k==="s"){
    pickI=(pickI+1)%3;
    pickArmed=false;
    paintStarter()
  }else if(k==="enter"||k===" ")starterConfirm();
  else if(k==="escape"&&pickArmed){
    pickArmed=false;
    paintStarter()
  }
}
function starterConfirm(){
  // the first press asks, the second press chooses: no partner is picked by accident
  if(!pickArmed){
    pickArmed=true;
    paintStarter();
    return
  }
  const l=PET_ORDER[pickI];
  S.starter=l;
  S.team=[l,...S.team.filter(x=>x!==l)];
  save();
  $("starter").classList.remove("on");
  BYT.x=P.x;
  BYT.y=P.y;
  plog("starter",{lang:l});
  hud();
  mode="walk";
  const after=pickDone;
  pickDone=null;
  after&&after(l)
}
$("pets").addEventListener("click",e=>{
  const d=e.target.closest(".pet");
  if(!d)return;
  const i=+d.dataset.i;
  if(i!==pickI){
    pickI=i;
    pickArmed=false;
    paintStarter();
    return
  }
  starterConfirm()
});
$("pets").addEventListener("keydown",e=>{
  if(e.key==="Enter"||e.key===" "){
    e.preventDefault();
    e.stopPropagation();
    const d=e.target.closest(".pet");
    if(d&&+d.dataset.i!==pickI){
      pickI=+d.dataset.i;
      pickArmed=false;
      paintStarter()
    }else starterConfirm()
  }
});
