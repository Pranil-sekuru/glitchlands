// Sandboxed Python runner (Pyodide, served from /vendor/pyodide), started as a Web Worker by runCode() in js/verify.js.
// It stays alive between runs so Python only loads once; a run that never ends is stopped by terminating the worker.
// The server sends this file with a CSP that only allows this site's own files, and once Python has loaded,
// every network API is removed and the `js` bridge is blocked, so player code cannot reach the network.
"use strict";
importScripts("vendor/pyodide/pyodide.js");
const ready = loadPyodide({ indexURL: "vendor/pyodide/" }).then(py => {
  self.fetch = self.XMLHttpRequest = self.WebSocket = self.importScripts = self.EventSource = undefined;
  py.runPython("import sys\nfor _m in ('js', 'pyodide_js', 'pyodide.ffi', 'pyodide.http'):\n    sys.modules[_m] = None\ndel _m");
  postMessage({ ready: true });
  return py;
}).catch(e => { postMessage({ ready: false, err: "Python could not load: " + e }); throw e; });
self.onmessage = async e => {
  const py = await ready, out = [];
  let bytes = [], over = false;
  const flush = () => { out.push(new TextDecoder().decode(new Uint8Array(bytes))); bytes = []; };
  py.setStdout({ raw: c => {   // one UTF-8 byte at a time
    if (c !== 10) { bytes.push(c); return; }
    flush();
    if (out.length > 300) { over = true; throw new Error("too much output"); }
  } });
  try {
    py.runPython(String(e.data.src), { globals: py.toPy({ __name__: "__main__" }) });
    if (bytes.length) flush();
    postMessage({ ok: true, out });
  } catch (err) {
    // keep only the last line of the traceback (e.g. "NameError: name 'totl' is not defined"), plus the line number
    const s = String(err && err.message || err), lines = s.trim().split("\n"), m = s.match(/line (\d+)/g);
    postMessage({ ok: false, err: over ? "too much output" : lines[lines.length - 1] + (m ? " (" + m[m.length - 1] + ")" : ""), out });
  }
};
