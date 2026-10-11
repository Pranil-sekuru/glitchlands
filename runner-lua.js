// Sandboxed Lua runner (Fengari, a Lua 5.3 VM in JavaScript, served from /vendor), started as a Web Worker by runCode() in js/verify.js.
// The server sends this file with a CSP of `default-src 'none'` plus this site's own scripts, so player code has no network.
// Each run gets a fresh Lua state with the standard libraries minus io/os/package (no files, no clock, no loading).
"use strict";
self.window = self;   // the Fengari bundle attaches itself to `window`
importScripts("vendor/fengari-web.js");
self.fetch = self.XMLHttpRequest = self.WebSocket = self.importScripts = self.EventSource = undefined;
const { lua, lauxlib, lualib, to_luastring } = self.fengari;
postMessage({ ready: true });
self.onmessage = e => {
  const out = [], L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  for (const lib of ["io", "os", "package", "require", "dofile", "loadfile", "js"]) { lua.lua_pushnil(L); lua.lua_setglobal(L, to_luastring(lib)); }
  lua.lua_pushjsfunction(L, L2 => {
    const n = lua.lua_gettop(L2), parts = [];
    for (let i = 1; i <= n; i++) { lauxlib.luaL_tolstring(L2, i); parts.push(lua.lua_tojsstring(L2, -1)); lua.lua_pop(L2, 1); }
    out.push(parts.join("\t"));
    if (out.length > 300) lauxlib.luaL_error(L2, to_luastring("too much output"));
    return 0;
  });
  lua.lua_setglobal(L, to_luastring("print"));
  let st = lauxlib.luaL_loadbuffer(L, to_luastring(String(e.data.src)), null, to_luastring("=bug.lua"));
  if (st === lua.LUA_OK) st = lua.lua_pcall(L, 0, 0, 0);
  postMessage(st === lua.LUA_OK ? { ok: true, out } : { ok: false, err: String(lua.lua_tojsstring(L, -1)).replace(/^bug\.lua:/, "line "), out });
};
