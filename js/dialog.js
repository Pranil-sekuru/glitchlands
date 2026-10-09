// dialog.js: Dialogue boxes and Region 1 interactions
// (classic script: shares one global scope with the other files in js/, loaded in the order listed in game.html)
// ---------- dialog ----------
let dlg=null;
// a Pokemon-style box across the lower half of the screen: the speaker's name on a plate, the line typed out letter by letter
function say(lines,after){
  mode="dialog";
  let i=0,full="",shown=0,timer=0;
  const box=document.createElement("div"),who=document.createElement("div"),txt=document.createElement("div"),more=document.createElement("span");
  box.className="dlg";
  box.setAttribute("role","dialog");
  box.setAttribute("aria-label","Dialogue");
  who.className="who";
  txt.className="txt";
  more.className="more";
  more.textContent="▼";
  box.append(who,txt,more);
  const typing=()=>shown<full.length;
  const type=()=>{
    clearTimeout(timer);
    txt.textContent=full.slice(0,shown);
    more.style.visibility=typing()?"hidden":"visible";
    if(typing()){
      shown=Math.min(full.length,shown+2);
      timer=setTimeout(type,28)
    }
  };
  const show=()=>{
    const m=lines[i].match(/^([A-Z][A-Z0-9 .'-]{1,30}):\s+([\s\S]*)$/);   // "NAME: words" puts NAME on the plate
    who.textContent=m?m[1]:"";
    who.style.display=m?"":"none";
    full=m?m[2]:lines[i];
    shown=REDUCE?full.length:0;
    $("sr").textContent=lines[i];
    type()
  };
  show();
  $("stage").appendChild(box);
  box.advance=()=>{
    if(typing()){   // the first press finishes the line, the next one moves on
      shown=full.length;
      type();
      return
    }
    i++;
    if(i>=lines.length){
      clearTimeout(timer);
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
    say(["PROF. SEMICOLON: Ah, a Debugger! The Great Compiler crashed, and glitches are creeping through our village. See the corrupted colours?","Three systems have broken: the lantern at the foot of my hill, the bell in the village square, and the water pump in the yard below the square.","Walk up to each one and press Enter. A Bug is hiding in its code. Find the line, name the mistake, then FIX it and run it.","The tall grass hides wild Bugs too: good practice, and they fill your Bugdex. If a fix fails, ask Byte why!"]);
    return
  }
  if(S.q.done){
    say(["PROF. SEMICOLON: Look at the village! Colour everywhere. You didn't smash the Bugs: you understood them.","The trail past the Compiler is clear now: the Syntax Forest lies north-east, and the bugs there are sneakier. Rest first, Debugger."]);
    return
  }
  if(n<3){
    say([`PROF. SEMICOLON: ${n} of 3 systems fixed. Still broken: ${SYS.filter(y=>!S.q.fixed[y.key]).map(y=>y.name.toLowerCase()).join(" and ")}.`,"Compare Expected with Got, find the line, then change it and press RUN."]);
    return
  }
  if(!S.q.nullo){
    say(["PROF. SEMICOLON: All three systems are humming again! But Nullo is guarding the stairs up to the Meadow Compiler, east past the palisade gate.","Out-think him and he will let you through."]);
    return
  }
  say(["PROF. SEMICOLON: Nullo stepped aside! The Meadow Compiler sits at the top of the east stairs. It's the heart of the village. Repair it."])
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
    say(["SIGN: MEADOW MAINFRAME. North-west: Prof. Semicolon's lab. North: the village square. Tall grass: wild Bugs. East stairs: the Meadow Compiler."]);
    return
  }
  if(c=="V"){
    say([{14:"VILLAGER: An Offbyonyx skipped the last song on my playlist! Count carefully out there.",13:"VILLAGER: Tip: the Expected and Got lines tell you what the Bug did wrong.",15:"VILLAGER: The tall grass south of here is crawling with Bugs. Good practice, if you're brave!"}[nx]||"VILLAGER: Hello, Debugger!"]);
    return
  }
  if(c=="L"){
    say(["PROF. SEMICOLON'S LAB HILL: He keeps his notes up there and chases Bugs down here."]);
    return
  }
  if(c=="x"){
    say(["The north-east trail is choked with glitch vines. Repair the Meadow Compiler first."]);
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
      say(["The Meadow Compiler is flickering. Nullo won't let anyone near it."]);
      return
    }
    if(S.q.done){
      say(["THE MEADOW COMPILER: Build succeeded. 0 errors. Hum."]);
      return
    }
    say(["THE MEADOW COMPILER: ERROR... ERROR... every system in the village depends on me...","A big Bug hides in my build counter. Fix it, Debugger!"],()=>startBattle(false,{bug:sysBug("Meadow Compiler"),quest:"compiler",label:"The Compiler crash",lives:4}))
  }
}
