// layout.js: picks a layout for the screen the game is played on, before anything is drawn
// (classic script: shares one global scope with the other files in js/, loaded first, in the order listed in game.html)
//   desk : a computer or a tablet held sideways: the game fills the window (a touch screen also gets floating buttons)
//   gb   : a phone held upright (or any tall, narrow window): a handheld console, screen on top, D-pad and A/B below
//   gba  : a phone held sideways: screen in the middle, D-pad on the left, A/B on the right
// Everything inside #screen sizes itself from that box (CSS container units), so each layout only moves the box.
"use strict";
const LAYOUT={mode:"desk",touch:false};
function pickLayout(){
  const vv=window.visualViewport,w=innerWidth,h=vv?Math.min(innerHeight,vv.height):innerHeight;
  let touch=matchMedia("(pointer:coarse)").matches||navigator.maxTouchPoints>0;
  let mode=(h>w*1.15&&w<820)?"gb":(touch&&w>h&&h<560)?"gba":"desk";
  const force=new URLSearchParams(location.search).get("layout");   // ?layout=gb|gba|desk forces one (handy for testing, or a preference)
  if(force==="gb"||force==="gba"||force==="desk"){
    mode=force;
    if(force!=="desk")touch=true
  }
  const root=document.documentElement;
  if(mode!==LAYOUT.mode||touch!==LAYOUT.touch){
    root.classList.remove("gb","gba","desk");
    root.classList.add(mode);
    root.classList.toggle("touch",touch);
    LAYOUT.mode=mode;
    LAYOUT.touch=touch;
    if(typeof placedFor!=="undefined")placeScreens()
  }
  // the on-screen keyboard shrinks only the *visual* viewport on phones: size the console to it so the code stays visible
  root.style.setProperty("--vh",(vv?vv.height:innerHeight)+"px");
  root.classList.toggle("kb",!!(vv&&vv.height<innerHeight*.8&&document.activeElement&&document.activeElement.tagName==="INPUT"))
}
// on a phone held upright the game has two screens, like a 3DS: the world or the battle arena on top, and the code console,
// dialogue and menus on the bottom. The panels are moved between the screens when the layout changes.
let placedFor="";
function placeScreens(){
  const two=LAYOUT.mode==="gb";
  if(placedFor===String(two))return;
  placedFor=String(two);
  const top=document.getElementById("screen"),bottom=document.getElementById("screen2"),battle=document.getElementById("battle");
  for(const id of ["console","say"])(two?bottom:battle).appendChild(document.getElementById(id));
  for(const id of ["dexov","starter"])(two?bottom:top).appendChild(document.getElementById(id));
  document.querySelectorAll(".dlg").forEach(d=>(two?bottom:top).appendChild(d))
}
const dlgHost=()=>document.getElementById(LAYOUT.mode==="gb"?"screen2":"screen");
pickLayout();
placeScreens();
addEventListener("resize",pickLayout);
addEventListener("orientationchange",()=>setTimeout(pickLayout,250));
if(window.visualViewport)visualViewport.addEventListener("resize",pickLayout);
document.addEventListener("focusin",()=>setTimeout(pickLayout,300));
document.addEventListener("focusout",()=>setTimeout(pickLayout,300));
