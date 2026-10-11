# Vendored runtimes

Served from this site (never from a CDN), so the player's code needs no network and the game works offline once loaded.

| Folder / file | What | Version | Licence | Source |
|---|---|---|---|---|
| `pyodide/` | Python 3.12 (CPython compiled to WebAssembly): `pyodide.js`, `pyodide.asm.js`, `pyodide.asm.wasm`, `python_stdlib.zip`, `pyodide-lock.json`. Only the core files, no extra packages. | 0.26.4 | Mozilla Public License 2.0 (Pyodide); CPython is under the PSF License | https://github.com/pyodide/pyodide (release 0.26.4) |
| `fengari-web.js` | Lua 5.3 virtual machine written in JavaScript | 0.1.4 | MIT | https://github.com/fengari-lua/fengari-web |

Files are unmodified copies of the published releases (downloaded from cdn.jsdelivr.net). Used by `runner-py.js` and `runner-lua.js`.
