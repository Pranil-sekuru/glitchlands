// Bug-bank tests. Run with:  node tests/bank.test.js   (also works under JavaScriptCore: jsc tests/bank.test.js)
// For every bug: the fixed program prints exactly `out`, the buggy one does not, and the metadata is coherent.
"use strict";
const isNode = typeof require === "function";
const say = isNode ? (...a) => console.log(...a) : (...a) => print(a.join(" "));
const src = isNode ? require("fs").readFileSync(require("path").join(__dirname, "..", "bugs.js"), "utf8") : read("bugs.js");
const { BANK, CATS, CATS8, blurry } = new Function(src + "\n;return { BANK, CATS, CATS8, blurry };")();

function run(code) {
  const out = [];
  const fmt = a => a.map(x => typeof x === "string" ? x : (x && typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ");
  const con = { log: (...a) => { out.push(fmt(a)); if (out.length > 300) throw new Error("too much output"); } };
  // endless loops are caught by this guard rather than a timer (the browser uses a Worker with a timeout)
  const guarded = code.replace(/\b(for|while)\s*\(([^)]*)\)\s*\{/g, (m) => m + "if(++__g>20000)throw new Error('loop');");
  try { new Function("console", "let __g=0;" + guarded)(con); return { ok: true, out }; } catch (e) { return { ok: false, err: String(e), out }; }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let failed = 0, passed = 0;
function check(name, cond, msg) { if (cond) passed++; else { failed++; say("FAIL", name, "-", msg); } }

const titles = new Set();
BANK.forEach(b => {
  const t = b.title;
  check(t, !titles.has(t), "duplicate title"); titles.add(t);
  const lines = b.code.split("\n");
  check(t, b.bug_line >= 1 && b.bug_line <= lines.length, "bug_line out of range");
  check(t, Array.isArray(b.hints) && b.hints.length >= 3, "needs 3 hints");
  check(t, b.ok.includes(b.category), "category must be an accepted label");
  check(t, !b.code.includes("§"), "marker left in code");
  const fixed = lines.slice(); fixed[b.bug_line - 1] = lines[b.bug_line - 1].match(/^\s*/)[0] + b.fix.trim();
  const ex = b.extra ? "\n" + b.extra : "";
  const f = run(fixed.join("\n") + ex), u = run(b.code + ex);
  check(t, f.ok && same(f.out, b.out), "fixed program must print `out`; got " + JSON.stringify(f.out) + " " + (f.err || ""));
  check(t, !(u.ok && same(u.out, b.out)), "buggy program must NOT already print `out`");
  // anti-cheat: the real fix may not rely on extra console.log lines
  check(t, !/console\.log/.test(b.fix) || /console\.log/.test(lines[b.bug_line - 1]), "fix should not add output");
});
// fairness: the "name the mistake" step must never offer a decoy that honestly describes the same bug
BANK.forEach(b => {
  const lists = b.r2 ? [CATS8] : [CATS];
  lists.forEach(list => {
    const decoys = list.filter(c => !b.ok.some(o => blurry(o).has(c)));
    check(b.title, decoys.length >= 2, "needs at least 2 unambiguous decoys, has " + decoys.length);
    check(b.title, !decoys.includes(b.category), "the true category can never be a decoy");
  });
  check(b.title, b.hints.length === 3 && b.hints.every(h => h.trim().length > 10 && h.length < 200), "three short hints, broad to specific");
  check(b.title, b.hints.every(h => !h.includes(b.fix.trim())), "no hint may contain the answer");
});
check("bank", BANK.length >= 30, "expected at least 30 bugs, got " + BANK.length);
check("bank", BANK.some(b => b.quest) && BANK.some(b => b.quest2), "quest bugs missing");

say(passed + " checks passed, " + failed + " failed (" + BANK.length + " bugs)");
if (failed) { if (isNode) process.exit(1); else throw new Error("tests failed"); }
