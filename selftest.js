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
  // start from an empty save slot: clear it and reload the game, so it boots as a brand-new player
  localStorage.removeItem((await ready()).__gl.SAVE_KEY);
  await new Promise(r => { frame.onload = r; frame.contentWindow.location.reload(); });
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
  // ---- Python (Pyodide) and Lua (Fengari) sandboxes ----
  const py = await W.runCode("total = 0\nfor c in [5, 10, 25]:\n    total += c\nprint('Total:', total)", 900, "py");
  check("python: runs and captures print", py.ok && py.out[0] === "Total: 40", JSON.stringify(py));
  const pyNet = await W.runCode("import js", 900, "py");
  check("python: the browser bridge (and so the network) is blocked", !pyNet.ok && /halted|None in sys.modules|ModuleNotFound/.test(pyNet.err), pyNet.err);
  const pyLoop = await W.runCode("while True:\n    pass", 400, "py");
  check("python: an endless loop is stopped, and Python still runs afterwards", !pyLoop.ok && pyLoop.timeout && (await W.runCode("print(2 + 2)", 900, "py")).out[0] === "4");
  const pyErr = await W.runCode("print(totl)", 900, "py");
  check("python: errors are short and readable", !pyErr.ok && /NameError: name 'totl' is not defined/.test(pyErr.err), pyErr.err);
  const lua = await W.runCode("local t = {5, 10, 25}\nlocal s = 0\nfor i = 1, #t do s = s + t[i] end\nprint('Total: ' .. s)", 900, "lua");
  check("lua: runs and captures print", lua.ok && lua.out[0] === "Total: 40", JSON.stringify(lua));
  const luaLibs = await W.runCode("print(io, os, require, js)", 900, "lua");
  check("lua: no files, clock, modules or JavaScript bridge", luaLibs.ok && luaLibs.out[0] === "nil\tnil\tnil\tnil", JSON.stringify(luaLibs.out));
  const luaLoop = await W.runCode("while true do end", 400, "lua");
  check("lua: an endless loop is stopped", !luaLoop.ok && luaLoop.timeout);

  // ---- a new game: your house, Mom, the door, no grass without a partner, the starter choice ----
  check("start: a new game begins upstairs at home, by the bed", G.REG === 0 && G.ROOM === "home-up" && G.mode === "dialog" && G.P.x === 2 && G.P.y === 3);
  drain(); stand(8, 3, 0); W.placeAt(8, 2, 0); W.landed();
  check("home: the stairs lead down to the kitchen", G.ROOM === "home-down" && G.P.x === 8 && G.P.y === 3);
  W.placeAt(8, 2, 0); W.landed();
  check("home: and back up again", G.ROOM === "home-up" && G.P.y === 3);
  W.placeAt(8, 2, 0); W.landed();
  stand(5, 5, 1); W.interact();
  check("start: Mom sends you to the Prof", G.mode === "dialog" && /partner/i.test(G.dlg.textContent + doc.getElementById("sr").textContent)); drain();
  stand(4, 6, 2); W.placeAt(4, 7, 2); W.landed();
  for (let i = 0; i < 30 && G.REG !== 1; i++) await sleep(100);   // the door swings open first (life.js)
  drain();
  check("start: the door leads out to the village", G.REG === 1 && G.P.x === G.R1.out[0] && G.P.y === G.R1.out[1]);
  // the lab and the cottage: in and out twice each (doors must not fire twice)
  const waitFor = async cond => { for (let i = 0; i < 40 && !cond(); i++) await sleep(100); return cond(); };
  for (const [name, at, inside, exit, back] of [["lab", [3, 4], [6, 9], [6, 10], [3, 4]], ["cottage", [14, 5], [4, 7], [4, 8], [14, 5]]]) {
    let ok = true;
    for (let n = 0; n < 2; n++) {
      stand(at[0], at[1], 0); W.interact();
      ok = ok && await waitFor(() => G.REG === 0 && G.ROOM === name && G.mode === "walk") && G.P.x === inside[0] && G.P.y === inside[1];
      stand(exit[0], exit[1] - 1, 2); W.placeAt(exit[0], exit[1], 2); W.landed();
      ok = ok && await waitFor(() => G.REG === 1 && G.mode === "walk") && G.P.x === back[0] && G.P.y === back[1];
      await sleep(700);   // let the door finish closing
    }
    check("rooms: walk into the " + name + " and back out, twice", ok, G.REG + " " + G.ROOM + " " + G.P.x + "," + G.P.y);
  }
  // every piece of furniture can be walked up to, in every room
  const blocked = [];
  for (const id of ["home-up", "home-down", "lab", "cottage"]) {
    W.enterRoom(id); const room = G.ROOMS[id], start = id === "home-up" ? [2, 3] : room.inside;
    for (const p of room.place.filter(p => p[8])) {
      const around = []; for (let x = p[1] - 1; x <= p[1] + p[3]; x++) for (let y = p[2] - 1; y <= p[2] + p[4]; y++) around.push([x, y]);
      if (!around.some(c => !G.SOLID.has((G.M[c[1]] || [])[c[0]] || "W") && W.reachable(start, c))) blocked.push(id + ":" + p[0]);
    }
  }
  check("rooms: every piece of furniture can be reached", blocked.length === 0, blocked.join(", "));
  W.setRegion(1); stand(13, 9, 2); G.mode = "walk";
  stand(13, 9, 2); W.placeAt(13, 10, 2); W.landed();
  check("start: tall grass sends you back without a partner", G.mode === "dialog" && G.mode !== "battle"); drain();
  check("start: back on the path", G.P.x === 13 && G.P.y === 9);
  stand(4, 6, 0); W.interact(); drain();
  check("start: the Prof offers three partners", G.mode === "starter" && doc.querySelectorAll("#pets .pet").length === 3);
  W.onKey("arrowright"); W.onKey("enter");
  check("start: the first press only asks", G.mode === "starter" && !G.S.starter);
  W.onKey("enter");
  check("start: the second press picks Pip (Python)", G.S.starter === "py" && G.S.team.join() === "py"); drain();
  check("start: picking a partner starts the village quest", G.S.q.on);

  // ---- Region 1: the whole quest (with Pip; the bell is Lua, the pump Python, the lantern JavaScript) ----
  const R1 = G.R1;
  W.setRegion(1); W.placeAt(R1.start[0], R1.start[1], 0); G.mode = "walk";
  Object.assign(G.S, { q: { on: false, fixed: {}, nullo: false, done: false }, tut: false, catches: 0, log: [], starter: "py", team: ["py"] });
  G.M[R1.nullo[1]][R1.nullo[0]] = "N"; W.buildMeadow(); W.hud();
  check("R1: systems and Compiler are on the map", [G.M[8][5], G.M[13][13], G.M[5][12]].join("") === "123" && G.M[4][27] === "C");
  stand(6, 8, 3); W.interact(); check("R1: a system refuses before the quest starts", G.mode === "dialog"); drain();
  stand(4, 6, 0); W.interact(); check("R1: the Professor starts the quest", G.S.q.on && /0\/3/.test($("quest").textContent)); drain();
  stand(12, 6, 0); W.interact(); drain();
  check("R1: the bell opens a tutorial battle", G.mode === "battle" && G.B.title === "Village Bell" && G.bs.tut, G.B && G.B.title);
  check("R1: the bell is a Lua Bug", G.B.lang === "lua" && /LUA/.test($("langtag").textContent));
  check("R1: bell repaired by fixing the Lua code", await solve() === true);
  check("R1: catching a Lua Bug recruits Luna", G.S.team.includes("lua")); drain();
  check("R1: progress shows 1/3", G.qFixed() === 1);
  stand(11, 14, 1); W.interact(); drain();
  check("R1: Pip speaks Python: full hints and +1 try", G.B.lang === "py" && G.bs.partner === "py" && G.bs.maxHints === 3 && G.bs.max === (G.S.catches < 3 ? 5 : 3) + 1);
  check("R1: pump repaired by fixing the Python code", await solve() === true); drain();
  stand(6, 8, 3); W.interact(); drain();
  check("R1: nobody speaks JavaScript yet: one hint, no extra try", G.B.lang === "js" && !G.bs.partner && G.bs.maxHints === 1 && G.bs.max === (G.S.catches < 3 ? 5 : 3));
  W.takeHint(); W.takeHint();
  check("R1: the second hint is locked", G.bs.hints === 1 && $("hintbtn").disabled);
  G.bs.lives = G.bs.max; 
  stand(27, 10, 1); W.interact(); check("R1: Nullo refuses until 3/3", G.mode === "dialog"); drain(); G.mode = "walk";
  check("R1: lantern repaired", await solve() === true);
  check("R1: and Byte joins: all three partners", G.S.team.length === 3); drain();
  stand(27, 10, 1); W.interact(); drain();
  check("R1: Nullo duel starts at 3/3", G.mode === "battle" && G.bs.rival, G.B && G.B.title);
  check("R1: Nullo beaten", await solve() === true); drain();
  check("R1: Nullo steps aside", G.M[R1.nullo[1]][R1.nullo[0]] === "." && G.S.q.nullo);
  stand(27, 5, 0); W.interact(); drain();
  check("R1: Meadow Compiler is a 4-heart boss (+1 with a partner who speaks its language)", G.mode === "battle" && G.B.title === "Meadow Compiler" && G.bs.lives === 4 + (G.bs.partner ? 1 : 0));
  check("R1: Compiler repaired", await solve() === true); drain();
  check("R1: village restored and saved", G.S.q.done && JSON.parse(localStorage.getItem(G.SAVE_KEY)).q.done);

  // ---- Region 2: the whole quest ----
  Object.assign(G.S, { intro: true, tut: true, catches: 0, q2: { on: false, lantern: false, relay: false, bridge: false, rival: false, chest: false, done: false } });
  W.syncGates(); W.setRegion(1); W.placeAt(G.R1.exit[0], G.R1.exit[1], 0); G.mode = "walk"; W.landed();
  check("R2: the north-east trail leads into the forest", G.REG === 2 && G.P.x === 6 && G.P.y === 34);
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
  stand(40, 8, 0); W.interact(); drain(); check("R2: Forest Compiler is a 4-heart boss (+1 with a partner)", G.bs.lives === 4 + (G.bs.partner ? 1 : 0) && G.B.title === "Forest Compiler"); check("R2: Compiler repaired", await solve() === true); drain();
  check("R2: the exit opens", G.S.q2.done && G.M[0][43] === "X");
  W.placeAt(43, 0, 0); W.landed(); drain(); G.mode = "walk"; W.placeAt(6, 35, 2); W.landed();
  check("R2: the way back home works", G.REG === 1 && G.P.x === G.R1.arrive[0] && G.P.y === G.R1.arrive[1]);

  // ---- movement and collision (physics.js) ----
  W.setRegion(1); stand(18, 7, 2);
  const spots = { "house door": [18, 6], "Prof": [4, 6], lantern: [6, 8], pump: [11, 14], bell: [12, 6], sign: [9, 12], Nullo: [27, 10], "old start": [3, 21] };
  const lost = Object.keys(spots).filter(k => !W.reachable([18, 7], spots[k]));
  check("physics: every village spot can be walked to", lost.length === 0, lost.join(", "));
  const nk = G.M[10][28]; G.M[10][28] = "N";
  check("physics: Nullo blocks the way to the Compiler", !W.reachable([18, 7], [27, 5]));
  G.M[10][28] = "."; G.M[1][29] = "X";
  check("physics: once Nullo steps aside, the Compiler and the trail are reachable", W.reachable([18, 7], [27, 5]) && W.reachable([18, 7], [29, 1]));
  G.M[10][28] = nk; G.M[1][29] = G.S.q.done ? "X" : "x";
  check("physics: a lone tree is still solid, but round: its square corners are walkable", W.sdf(7.5, 9.5) < 0 && W.sdf(7, 9) > 0.28 && W.sdf(8, 10) > 0.28);
  W.setRegion(2);
  const bridge = []; for (let y = 22; y <= 23; y++) for (let x = 22; x <= 26; x++) { bridge.push(G.M[y][x]); G.M[y][x] = "B"; }
  check("physics: forest: the broken bridge blocks the east bank", !W.reachable([6, 34], [38, 13]));
  for (let y = 22; y <= 23; y++) for (let x = 22; x <= 26; x++) G.M[y][x] = "b";
  check("physics: forest: every repair spot, Nullo and the chest can be walked to", [[11, 28], [14, 24], [20, 21], [13, 12], [38, 13], [36, 29]].every(t => W.reachable([6, 34], t)));
  let bi = 0; for (let y = 22; y <= 23; y++) for (let x = 22; x <= 26; x++) G.M[y][x] = bridge[bi++];
  W.setRegion(1); stand(13, 9, 1); G.mode = "walk";
  const key = (k, down) => W.dispatchEvent(new W.KeyboardEvent(down ? "keydown" : "keyup", { key: k }));
  key("ArrowRight", true); let ms = 0; while (G.P.vx < 6.3 && ms < 400) { W.stepPlayer(8); ms += 8; }
  check("physics: full speed in under 0.1 s", ms <= 100, ms + " ms");
  key("ArrowRight", false); ms = 0; while (Math.hypot(G.P.vx, G.P.vy) > 0 && ms < 400) { W.stepPlayer(8); ms += 8; }
  check("physics: a dead stop in under 0.1 s (no sliding on ice)", ms <= 100, ms + " ms");
  // push diagonally into the fence north of the grass: you slide along it and never sink in
  stand(13, 9, 0); G.mode = "walk"; const x0 = G.P.px; let inside = 0;
  key("ArrowUp", true); key("ArrowLeft", true);
  for (let i = 0; i < 60; i++) { W.stepPlayer(16); if (W.sdf(G.P.px, G.P.py) < 0.28 - 0.02) inside++; }
  key("ArrowUp", false); key("ArrowLeft", false); W.stepPlayer(16); W.stepPlayer(16);
  check("physics: you slide along walls and never sink into them", inside === 0 && Math.abs(G.P.px - x0) > 0.5, "inside " + inside + ", slid " + (G.P.px - x0).toFixed(2));

  // ---- a clean screen: nothing floats over the world; the menu holds the goal ----
  stand(13, 9, 2); G.mode = "walk"; W.onKey("m");
  check("menu: M opens the menu, with the current goal in it", G.mode === "dex" && $("dexov").classList.contains("on") && $("mgoal").textContent.length > 3);
  W.onKey("m");
  check("menu: M closes it again", G.mode === "walk");
  check("clean screen: no status bar, quest box or key hints over the world", !doc.querySelector(".hud") && !$("keys") && $("quest").classList.contains("sr"));

  // ---- accessibility basics ----
  const unnamed = [...doc.querySelectorAll("button, a[href]")].filter(b => !(b.textContent.trim() || b.getAttribute("aria-label") || b.title));
  check("a11y: every button and link has a name", unnamed.length === 0, unnamed.map(b => b.id || b.outerHTML.slice(0, 40)).join(" "));
  const canvases = [...doc.querySelectorAll("canvas")].filter(c => !c.getAttribute("aria-label") && c.getAttribute("aria-hidden") !== "true");
  check("a11y: every canvas has a text alternative", canvases.length === 0);
  check("a11y: page has a language, a title and a main landmark", doc.documentElement.lang === "en" && doc.title && doc.querySelector("main"));
  check("a11y: dialogue is announced through a live region", $("sr") && $("sr").getAttribute("aria-live") === "polite");
  check("a11y: pinch-zoom is not disabled", !/user-scalable\s*=\s*no|maximum-scale/.test(doc.querySelector('meta[name="viewport"]').content));
  check("layout: a layout class is set", /\b(desk|gb|gba)\b/.test(doc.documentElement.className));
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
