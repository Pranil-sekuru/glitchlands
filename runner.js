// Sandboxed runner for the player's code, started as a Web Worker by runCode() in game.js.
// The server sends this file with a Content-Security-Policy of `default-src 'none'`, so the browser itself blocks
// every network request, nested worker and import from player code; the assignments below are a second layer.
"use strict";
self.fetch = self.XMLHttpRequest = self.WebSocket = self.importScripts = undefined;
const fmt = a => a.map(x => typeof x === "string" ? x : (x && typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ");
self.onmessage = e => {
  const out = [];
  const con = { log: (...a) => { out.push(fmt(a)); if (out.length > 300) throw new Error("too much output"); } };
  try { (new Function("console", String(e.data.src)))(con); postMessage({ ok: true, out }); }
  catch (err) { postMessage({ ok: false, err: String(err), out }); }
};
