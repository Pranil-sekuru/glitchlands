// dialog.js: Dialogue boxes and Region 1 interactions
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- dialog ----------
let dlg=null;
function say(lines,after){
  mode="dialog";
  let i=0;
  const box=document.createElement("div");
  box.className="dlg";
  box.setAttribute("role","dialog");
  box.setAttribute("aria-label","Dialogue");
  const show=()=>{
    box.textContent=lines[i]+"   ▼";
    $("sr").textContent=lines[i]
  };
  show();
  $("stage").appendChild(box);
  box.advance=()=>{
    i++;
    if(i>=lines.length){
      box.remove();
      dlg=null;
      mode="walk";
      after&&after()
    }else show()
  };
  box.onclick=box.advance;
  dlg=box
}
const sysBug=t=>BANK.find(b=>b.title===t);
function profTalk(){
  const n=qFixed();
  if(!S.q.on){
    S.q.on=true;
    save();
    hud();
    say(["PROF. SEMICOLON: Ah, a Debugger! The Great Compiler crashed, and glitches are creeping through our village. See the corrupted colours?","Three systems have broken: the lantern beside my hill, the water pump in the south-east corner, and the bell in the village square.","Walk up to each one and press Enter. A Bug is hiding in its code. Find the line, name the mistake, then FIX it and run it.","The tall grass hides wild Bugs too: good practice, and they fill your Bugdex. If a fix fails, ask Byte why!"]);
    return
  }
  if(S.q.done){
    say(["PROF. SEMICOLON: Look at the village! Colour everywhere. You didn't smash the Bugs: you understood them.","The south road is clear now: the Syntax Forest lies that way, and the bugs there are sneakier. Rest first, Debugger."]);
    return
  }
  if(n<3){
    say([`PROF. SEMICOLON: ${n} of 3 systems fixed. Still broken: ${SYS.filter(y=>!S.q.fixed[y.key]).map(y=>y.name.toLowerCase()).join(" and ")}.`,"Compare Expected with Got, find the line, then change it and press RUN."]);
    return
  }
  if(!S.q.nullo){
    say(["PROF. SEMICOLON: All three systems are humming again! But Nullo took the Meadow Compiler's key and is waiting at the east gate.","Out-think him and the gate will open."]);
    return
  }
  say(["PROF. SEMICOLON: The gate is open! The Meadow Compiler sits at the end of the east corridor. It's the heart of the village. Repair it."])
}
function sysTalk(sy){
  if(S.q.fixed[sy.key]){
    say([sy.fixedLine]);
    return
  }
  if(!S.q.on){
    say([sy.name+": it's flickering and spitting corrupted pixels. Prof. Semicolon (white hair, by the lab hill) might know why."]);
    return
  }
  say(sy.intro,()=>startBattle(false,{bug:sysBug(sy.bug),quest:sy.key,label:sy.label}))
}
function interact(){
  if(REG===2)return interact2();
  P.act={t0:performance.now()};
  const nx=P.x+DIRS[P.dir][0],ny=P.y+DIRS[P.dir][1],c=(M[ny]||[])[nx];
  if(c=="P"){
    S.talked=true;
    save();
    profTalk();
    return
  }
  if(c=="s"){
    say(["SIGN: MEADOW MAINFRAME. Prof. Semicolon's lab hill is here. Tall grass: wild Bugs. East gate: the way to the Meadow Compiler."]);
    return
  }
  if(c=="V"){
    say([(nx==10?"VILLAGER: An Offbyonyx skipped the last song on my playlist! Count carefully out there.":"VILLAGER: Tip: the Expected and Got lines tell you what the Bug did wrong.")]);
    return
  }
  if(c=="L"){
    say(["PROF. SEMICOLON'S LAB HILL: He keeps his notes up there and chases Bugs down here."]);
    return
  }
  if(c=="x"){
    say(["The south path is choked with glitch vines. Restore the village first."]);
    return
  }
  if(c=="1"||c=="2"||c=="3"){
    sysTalk(SYS[+c-1]);
    return
  }
  if(c=="N"){
    if(qFixed()<3){
      say([`NULLO: A lamp and a pump? Cute. Come back when your whole village hums, Debugger. (${qFixed()}/3 fixed)`]);
      return
    }
    const t2=BANK.filter(b=>!b.quest&&(TIER[b.title]||2)==2);
    say(["NULLO: So you fixed the village. I don't read the code. I just hit the biggest line.","NULLO: Let's see if you can out-think me! I have the Compiler's key."],()=>startBattle(true,{bug:t2[Math.floor(Math.random()*t2.length)]}));
    return
  }
  if(c=="C"){
    if(!S.q.nullo){
      say(["The Meadow Compiler is flickering behind a locked panel. Nullo has the key."]);
      return
    }
    if(S.q.done){
      say(["THE MEADOW COMPILER: Build succeeded. 0 errors. Hum."]);
      return
    }
    say(["THE MEADOW COMPILER: ERROR... ERROR... every system in the village depends on me...","A big Bug hides in my build counter. Fix it, Debugger!"],()=>startBattle(false,{bug:sysBug("Meadow Compiler"),quest:"compiler",label:"The Compiler crash",lives:4}))
  }
}
