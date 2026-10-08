"use strict";
let S={};try{S=JSON.parse(localStorage.getItem("gl1")||"{}")}catch(e){}
const log=(S.log||[]).slice(),app=document.getElementById("app");
const esc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;");
const mmss=ms=>Math.floor(ms/60000)+"m "+String(Math.round(ms%60000/1000)).padStart(2,"0")+"s";
// split into hunts: a hunt runs from "start" to "end"/"abandon" (or the next start)
const hunts=[];let cur=null;
for(const e of log){
 if(e.ev==="start"){if(cur)hunts.push(cur);cur={sid:e.sid,title:e.b,t0:e.t,quest:e.quest,rival:e.rival,daily:e.daily,tut:e.tut,ev:[],out:"left unfinished"}}
 else if(cur){cur.ev.push(e);if(e.ev==="end"){cur.out=e.win?"fixed ✓":"got away ✗";cur.t1=e.t}if(e.ev==="abandon"){cur.out="abandoned";cur.t1=e.t}}
}
if(cur)hunts.push(cur);
const count=(h,ev,f)=>h.ev.filter(e=>e.ev===ev&&(!f||f(e))).length;
const rows=hunts.map(h=>{
 const dur=(h.t1||h.ev.length&&h.ev[h.ev.length-1].t||h.t0)-h.t0,wl=count(h,"line",e=>!e.ok),wt=count(h,"type",e=>!e.ok),runs=count(h,"run"),bad=count(h,"run",e=>!e.ok),hints=count(h,"hint"),byte=count(h,"byte"),give=count(h,"giveup");
 const stuck=wl>=2||bad>=3||give||h.out==="abandoned"||dur>180000;
 return {h,dur,wl,wt,runs,bad,hints,byte,give,stuck,kind:h.quest?("quest: "+h.quest):h.rival?"Nullo":h.daily?"daily":h.tut?"practice":"wild"}});
let html="";
html+=`<div class="card"><b>Players (sessions):</b> ${new Set(log.map(e=>e.sid)).size||0} &nbsp; <b>Hunts logged:</b> ${hunts.length} &nbsp; <b>Quest:</b> ${esc(JSON.stringify(S.q||{}))}</div>`;
if(!hunts.length)html+="<p>No hunts logged yet. Play the game first, then reload this page.</p>";
else{
 const stuck=rows.filter(r=>r.stuck);
 html+=`<h2>Where people struggled (${stuck.length} of ${rows.length} hunts)</h2>`;
 html+=stuck.length?"<div class=card>"+stuck.map(r=>`<div><span class="warn">${esc(r.h.title)}</span> (${r.kind}): ${r.wl} wrong line(s), ${r.bad} failed run(s), ${r.hints} hint(s), ${r.byte} Byte ask(s), ${r.give?"GAVE UP, ":""}${r.h.out} in ${mmss(r.dur)}</div>`).join("")+"</div>":"<div class=card>Nothing flagged. Either everyone sailed through, or you need more players.</div>";
 html+=`<h2>All hunts</h2><table><tr><th>when</th><th>bug</th><th>kind</th><th>time</th><th>wrong lines</th><th>failed runs</th><th>hints</th><th>Byte</th><th>outcome</th></tr>`+
  rows.map(r=>`<tr><td>${new Date(r.h.t0).toLocaleTimeString()}</td><td>${esc(r.h.title)}</td><td>${r.kind}</td><td>${mmss(r.dur)}</td><td class="${r.wl>1?"bad":""}">${r.wl}</td><td class="${r.bad>2?"bad":""}">${r.bad}/${r.runs}</td><td>${r.hints}</td><td>${r.byte}</td><td class="${r.h.out.startsWith("fixed")?"ok":"bad"}">${r.h.out}</td></tr>`).join("")+"</table>";
 // which bugs cause the most trouble, across everyone
 const by={};rows.forEach(r=>{const b=by[r.h.title]=by[r.h.title]||{n:0,wl:0,bad:0,fail:0};b.n++;b.wl+=r.wl;b.bad+=r.bad;if(!r.h.out.startsWith("fixed"))b.fail++});
 html+=`<h2>Hardest bugs</h2><table><tr><th>bug</th><th>times</th><th>wrong lines</th><th>failed runs</th><th>not fixed</th></tr>`+
  Object.entries(by).sort((a,b)=>(b[1].bad+b[1].wl+3*b[1].fail)-(a[1].bad+a[1].wl+3*a[1].fail)).map(([t,b])=>`<tr><td>${esc(t)}</td><td>${b.n}</td><td>${b.wl}</td><td>${b.bad}</td><td>${b.fail}</td></tr>`).join("")+"</table>";
}
html+=`<h2>Actions</h2><button id="copy">Copy summary</button><button id="clear">Clear the log</button><pre id="sum"></pre>`;
app.innerHTML=html;
const summary=hunts.length?rows.map(r=>`${r.h.title} [${r.kind}] ${mmss(r.dur)} wrongLines=${r.wl} failedRuns=${r.bad}/${r.runs} hints=${r.hints} byte=${r.byte} -> ${r.h.out}`).join("\n"):"(empty)";
document.getElementById("sum").textContent=summary;
document.getElementById("copy").onclick=()=>navigator.clipboard&&navigator.clipboard.writeText(summary);
document.getElementById("clear").onclick=()=>{if(confirm("Clear the playtest log?")){S.log=[];localStorage.setItem("gl1",JSON.stringify(S));location.reload()}};
