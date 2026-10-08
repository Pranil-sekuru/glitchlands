// quest1.js: Region 1 quest: the three village systems, quest text
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
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
  return "Repair the Meadow Compiler (east corridor)"
}
