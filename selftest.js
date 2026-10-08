// In-browser integration tests: open /selftest.html. Drives the real game in an iframe through its public functions.
"use strict";
const frame = document.getElementById("game"), results = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail: detail === undefined ? "" : String(detail) });

async function ready() {
  for (let i = 0; i < 200; i++) {
    const W = frame.contentWindow;
    if (W && W.__gl && W.__gl.artReady) return W;
    await sleep(100);
  }
  throw new Error("the game did not finish loading");
}

async function run() {
  const W = await ready(), G = W.__gl, doc = W.document, $ = id => doc.getElementById(id);
  const drain = () => { for (let n = 0; G.dlg && n < 40; n++) G.dlg.advance(); };
  const stand = (x, y, dir) => { W.placeAt(x, y, dir); G.mode = "walk"; };
  async function solve() {   // play one hunt the way a learner should: pick the line, name the mistake, fix it, run it, throw the net
    const B = G.B, lines = B.code.split("\n");
    G.bs.cur = B.bug_line - 1; W.pickLine();
    G.bs.ci = G.bs.opts.indexOf(B.category); if (G.bs.phase === "type") W.pickType();
    $("fxin").value = lines[B.bug_line - 1].match(/^\s*/)[0] + B.fix;
    await W.runFix(); await sleep(1250);
    W.netFrame(G.bs.qs + 2100);
    const won = G.bs.won; W.endBattle(); return won;
  }
  localStorage.removeItem(G.SAVE_KEY);

  // ---- the code sandbox ----
  const r = await W.runCode("console.log(typeof fetch, typeof XMLHttpRequest, typeof WebSocket);\nconsole.log(2 + 2);");
  check("sandbox: runs code and captures console.log", r.ok && r.out[1] === "4", JSON.stringify(r.out));
  check("sandbox: network APIs are removed", r.out[0] === "undefined undefined undefined", r.out[0]);
  const loop = await W.runCode("while (true) {}", 300);
  check("sandbox: an endless loop is stopped by the timeout", !loop.ok && loop.timeout);
  const bad = await W.runCode("throw new Error('boom')");
  check("sandbox: errors are reported, not thrown", !bad.ok && /boom/.test(bad.err));

  // ---- Region 1: the whole quest ----
  W.setRegion(1); W.placeAt(7, 9, 2); G.mode = "walk";
  Object.assign(G.S, { q: { on: false, fixed: {}, nullo: false, done: false }, tut: false, catches: 0, log: [] });
  G.M[8][28] = "N"; W.buildMeadow(); W.hud();
  check("R1: systems and Compiler are on the map", [G.M[7][4], G.M[9][12], G.M[5][9]].join("") === "123" && G.M[8][30] === "C");
  stand(4, 8, 0); W.interact(); check("R1: a system refuses before the quest starts", G.mode === "dialog"); drain();
  stand(7, 7, 0); W.interact(); check("R1: the Professor starts the quest", G.S.q.on && /0\/3/.test($("quest").textContent)); drain();
  stand(9, 6, 0); W.interact(); drain();
  check("R1: the bell opens a tutorial battle", G.mode === "battle" && G.B.title === "Village Bell" && G.bs.tut, G.B && G.B.title);
  check("R1: bell repaired by fixing the code", await solve() === true); drain();
  check("R1: progress shows 1/3", G.qFixed() === 1);
  stand(12, 8, 2); W.interact(); drain(); check("R1: pump repaired", await solve() === true); drain();
  stand(27, 8, 1); W.interact(); check("R1: Nullo refuses until 3/3", G.mode === "dialog"); drain(); G.mode = "walk";
  stand(4, 8, 0); W.interact(); drain(); check("R1: lantern repaired", await solve() === true); drain();
  stand(27, 8, 1); W.interact(); drain();
  check("R1: Nullo duel starts at 3/3", G.mode === "battle" && G.bs.rival, G.B && G.B.title);
  check("R1: Nullo beaten", await solve() === true); drain();
  check("R1: the gate opens", G.M[8][28] === "." && G.S.q.nullo);
  stand(29, 8, 1); W.interact(); drain();
  check("R1: Meadow Compiler is a 4-heart boss", G.mode === "battle" && G.B.title === "Meadow Compiler" && G.bs.lives === 4);
  check("R1: Compiler repaired", await solve() === true); drain();
  check("R1: village restored and saved", G.S.q.done && JSON.parse(localStorage.getItem(G.SAVE_KEY)).q.done);

  // ---- Region 2: the whole quest ----
  Object.assign(G.S, { intro: true, tut: true, catches: 0, q2: { on: false, lantern: false, relay: false, bridge: false, rival: false, chest: false, done: false } });
  W.syncGates(); W.setRegion(1); W.placeAt(6, 23, 2); G.mode = "walk"; W.landed();
  check("R2: the south road leads into the forest", G.REG === 2 && G.P.x === 6 && G.P.y === 34);
  stand(13, 12, 0); W.interact(); check("R2: a system refuses before the ranger's quest", G.mode === "dialog" && !G.dlg.textContent.includes("A Bug")); drain();
  stand(11, 28, 3); W.interact(); check("R2: the ranger starts the quest", G.S.q2.on); drain();
  stand(13, 12, 0); W.interact(); drain(); check("R2: relay repaired", await solve() === true); drain();
  stand(20, 21, 1); W.interact(); drain(); check("R2: bridge controls repaired", await solve() === true); drain();
  check("R2: the bridge appears", G.M[22][22] === "b");
  stand(14, 24, 1); W.interact(); drain(); check("R2: lanterns repaired", await solve() === true); drain();
  check("R2: three repairs counted", G.repairsDone() === 3);
  stand(38, 13, 1); W.interact(); drain(); check("R2: Nullo duel", G.mode === "battle" && G.bs.rival); check("R2: Nullo beaten", await solve() === true); drain();
  check("R2: the root gate opens", G.M[12][38] === "." && G.M[12][39] === ".");
  stand(36, 29, 1); W.interact(); drain(); check("R2: the chest fight is won (Hint Lens)", await solve() === true && G.S.q2.chest); drain();
  stand(40, 8, 0); W.interact(); drain(); check("R2: Forest Compiler is a 4-heart boss", G.bs.lives === 4 && G.B.title === "Forest Compiler"); check("R2: Compiler repaired", await solve() === true); drain();
  check("R2: the exit opens", G.S.q2.done && G.M[0][43] === "X");
  W.placeAt(43, 0, 0); W.landed(); drain(); G.mode = "walk"; W.placeAt(6, 35, 2); W.landed();
  check("R2: the way back home works", G.REG === 1 && G.P.x === 6 && G.P.y === 22);

  // ---- accessibility basics ----
  const unnamed = [...doc.querySelectorAll("button, a[href]")].filter(b => !(b.textContent.trim() || b.getAttribute("aria-label") || b.title));
  check("a11y: every button and link has a name", unnamed.length === 0, unnamed.map(b => b.id || b.outerHTML.slice(0, 40)).join(" "));
  const canvases = [...doc.querySelectorAll("canvas")].filter(c => !c.getAttribute("aria-label"));
  check("a11y: every canvas has a text alternative", canvases.length === 0);
  check("a11y: page has a language, a title and a main landmark", doc.documentElement.lang === "en" && doc.title && doc.querySelector("main"));
  check("a11y: dialogue is announced through a live region", $("sr") && $("sr").getAttribute("aria-live") === "polite");
  check("a11y: pinch-zoom is not disabled", !/user-scalable\s*=\s*no|maximum-scale/.test(doc.querySelector('meta[name="viewport"]').content));
  check("bank: at least 30 bugs are loaded", G.BANK.length >= 30, G.BANK.length);

  localStorage.removeItem(G.SAVE_KEY);
}

function render() {
  const list = document.getElementById("results"), sum = document.getElementById("summary");
  list.innerHTML = "";
  results.forEach(t => { const li = document.createElement("li"); li.className = t.ok ? "pass" : "fail"; li.textContent = t.name; if (!t.ok && t.detail) { const s = document.createElement("small"); s.textContent = "  (" + t.detail + ")"; li.appendChild(s); } list.appendChild(li); });
  const failed = results.filter(t => !t.ok).length;
  sum.dataset.status = failed ? "fail" : "pass";
  sum.textContent = failed ? failed + " of " + results.length + " checks FAILED" : "All " + results.length + " checks passed";
}

run().catch(e => check("test run completed", false, e && e.stack ? e.stack.split("\n")[0] : e)).then(render);
