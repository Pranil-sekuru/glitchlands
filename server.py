#!/usr/bin/env python3
"""Glitchlands server. Python standard library only.  Run: python3 server.py  ->  http://localhost:8000

 - serves the landing page, the game and the art
 - GET  /healthz     -> {"ok": true}
 - GET  /api/status  -> {"ai": true|false}   (true when ANTHROPIC_API_KEY is set)
 - POST /api/bug     -> asks Claude for ONE fresh beginner bug (JavaScript) and returns it.
                        The *browser* then runs the buggy and the fixed program before the bug is ever shown,
                        so a bug that does not behave as claimed is thrown away.
Without an API key the game simply uses its built-in, hand-checked bug bank.

Configuration (environment): ANTHROPIC_API_KEY (or the file ~/.anthropic_key), BHA_MODEL, PORT, BHA_RATE_PER_MIN, BHA_DAILY_CAP.
The key is only ever read from the environment; it is never logged, stored or sent to the browser.
"""
import gzip
import hashlib
import json
import os
import random
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get("BHA_MODEL", "claude-sonnet-5-5")
CATS = ["off-by-one", "wrong-operator", "wrong-variable", "bad-condition", "missing-return", "infinite-loop"]
DIFFICULTIES = ("easy", "medium", "hard")
MAX_BODY = 2048
GZIP_TYPES = (".html", ".js", ".css", ".json", ".txt", ".md")
# Pages may only load their own scripts/styles/images/workers and talk to this server. The player's code runs in runner.js,
# which is served with default-src 'none' (no network, no nested workers) and only 'unsafe-eval' so it can run the program.
PAGE_CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; worker-src 'self'; "
            "connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'")
RUNNER_CSP = "default-src 'none'; script-src 'unsafe-eval'"
MIME = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg",
        ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8"}

SYSTEM = """You design ONE broken JavaScript program for a beginner debugging game. Reply with ONLY a JSON object (no prose, no code fences) with exactly these keys:
{"title": spoiler-free fun name that does not hint at the bug type,
 "task": one sentence: what the program is SUPPOSED to do,
 "code": the BROKEN program as one string with \\n line breaks (6-12 lines). Output only via console.log. No input, no randomness, no dates, no libraries,
 "bug_line": 1-based number of the single line containing the bug,
 "category": one of __CATS__,
 "expected": short sentence: what the correct program prints,
 "actual": short sentence: what the broken program does or prints,
 "extra": OPTIONAL string of hidden test lines appended after the program: one to three lines, each EXACTLY a console.log(...) call that runs the program's function(s) with DIFFERENT inputs than the visible example (use "" when the program has no function). A wrong-but-lucky fix must fail these,
 "out": array of strings = EXACTLY the lines the FIXED program prints INCLUDING the output of the extra lines (one string per console.log call; multiple arguments joined by one space; numbers as JavaScript prints them),
 "hints": exactly 3 questions that guide a beginner without stating the fix (broad -> specific),
 "fix": the corrected replacement for the bug line: ONE line, no leading indentation,
 "explanation": two sentences: why it was wrong and how to spot it next time}
Rules: exactly one bug and it must live on one line; a realistic beginner mistake of the chosen category; the FIXED program must finish quickly and print exactly `out`; the broken program must behave differently from the fixed one; difficulty: __DIFF__."""


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def get_key():
    """The API key comes from the environment (Cloud Run secret) or, for local development, from ~/.anthropic_key. Never from the repo."""
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        try:
            with open(os.path.expanduser(os.environ.get("BHA_KEY_FILE", "~/.anthropic_key"))) as f:
                key = f.read().strip()
        except OSError:
            key = ""
    return key


def has_key():
    return bool(get_key())


def int_env(name, default):
    try:
        return max(1, int(os.environ.get(name, default)))
    except ValueError:
        return default


def validate(d):
    """Shape-check what the model returned -> (bug, None) or (None, reason). The browser does the real check by running the code."""
    if not isinstance(d, dict):
        return None, "not an object"
    try:
        lines = str(d["code"]).split("\n")
        checks = [
            (isinstance(d["bug_line"], int) and not isinstance(d["bug_line"], bool) and 1 <= d["bug_line"] <= len(lines), "bug_line"),
            (3 <= len(lines) <= 20, "code length"),
            (d["category"] in CATS, "category"),
            (isinstance(d["out"], list) and 1 <= len(d["out"]) <= 12 and all(isinstance(x, str) for x in d["out"]), "out"),
            (isinstance(d["hints"], list) and len(d["hints"]) >= 3 and all(isinstance(x, str) for x in d["hints"]), "hints"),
            (isinstance(d["fix"], str) and d["fix"].strip() != "" and "\n" not in d["fix"].strip(), "fix"),
            (all(isinstance(d[k], str) and d[k].strip() for k in ("title", "task", "expected", "actual", "explanation")), "text fields"),
        ]
    except (KeyError, TypeError):
        return None, "missing field"
    for ok, name in checks:
        if not ok:
            return None, "bad " + name
    extra = d.get("extra", "") or ""
    if not isinstance(extra, str) or len(extra) > 400:
        return None, "bad extra"
    elines = [l for l in extra.split("\n") if l.strip()]
    if len(elines) > 3 or not all(re.fullmatch(r"\s*console\.log\(.*\);?\s*", l) for l in elines):
        return None, "extra must be console.log lines"
    out = {k: d[k] for k in ("title", "task", "code", "bug_line", "category", "expected", "actual", "out", "hints", "fix", "explanation")}
    out["extra"] = "\n".join(elines)
    return out, None


def extract_json(text):
    """Pull the JSON object out of a model reply (tolerates code fences, prose, raw newlines inside strings)."""
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        raise ValueError("no JSON object in reply")
    return json.loads(m.group(0), strict=False)


def reply_text(resp):
    """Join the text blocks of a Messages API response (other block types are ignored)."""
    return "".join(b.get("text", "") for b in resp.get("content", []) if isinstance(b, dict) and b.get("type") == "text")


def ask_claude(difficulty):
    body = {"model": MODEL, "max_tokens": 3000,
            "system": SYSTEM.replace("__CATS__", str(CATS)).replace("__DIFF__", difficulty),
            "messages": [{"role": "user", "content": "Make one fresh bug. Category: %s." % random.choice(CATS[:5])}]}
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", json.dumps(body).encode(),
                                 {"content-type": "application/json", "x-api-key": get_key(),
                                  "anthropic-version": "2023-06-01"})
    with urllib.request.urlopen(req, timeout=40) as r:
        resp = json.load(r)
    return validate(extract_json(reply_text(resp)))


class Limiter:
    """Sliding one-minute window per client plus a global daily cap, so an open endpoint cannot burn the API budget."""

    def __init__(self, per_min, daily, clock=time.time):
        self.per_min, self.daily, self.clock = per_min, daily, clock
        self.hits, self.day, self.count = {}, None, 0
        self.lock = threading.Lock()

    def allow(self, who):
        now = self.clock()
        day = int(now // 86400)
        with self.lock:
            if day != self.day:
                self.day, self.count = day, 0
            if self.count >= self.daily:
                return False
            recent = [t for t in self.hits.get(who, []) if now - t < 60]
            if len(recent) >= self.per_min:
                self.hits[who] = recent
                return False
            recent.append(now)
            self.hits[who] = recent
            if len(self.hits) > 5000:  # forget idle clients
                self.hits = {k: v for k, v in self.hits.items() if v and now - v[-1] < 60}
            self.count += 1
            return True


LIMITER = Limiter(int_env("BHA_RATE_PER_MIN", 6), int_env("BHA_DAILY_CAP", 400))


GZIP_MIME = {MIME[e].split(";")[0] for e in GZIP_TYPES}


def safe_path(path):
    """Map a URL path to a file under HERE, or None. Only the pages and assets/ are public."""
    name = path.lstrip("/") or "index.html"
    if re.fullmatch(r"([A-Za-z0-9_-]+\.(html|css)|(js/)?[A-Za-z0-9_-]+\.js)", name):
        f = os.path.join(HERE, name)
        return f if os.path.isfile(f) else None
    if name.startswith("assets/"):
        root = os.path.realpath(os.path.join(HERE, "assets"))
        f = os.path.realpath(os.path.join(root, name[len("assets/"):]))
        if f.startswith(root + os.sep) and os.path.isfile(f):
            return f
    return None


class H(BaseHTTPRequestHandler):
    server_version = "Glitchlands"

    def _send(self, code, body, ctype="application/json", cache="no-store", extra=None):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        headers = {"content-type": ctype, "cache-control": cache, "x-content-type-options": "nosniff", "referrer-policy": "no-referrer"}
        headers.update(extra or {})
        if len(data) > 1024 and ctype.split(";")[0] in GZIP_MIME and "gzip" in self.headers.get("accept-encoding", ""):
            data = gzip.compress(data, 6)
            headers["content-encoding"] = "gzip"
            headers["vary"] = "accept-encoding"
        self.send_response(code)
        for k, v in headers.items():
            self.send_header(k, v)
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def client(self):
        fwd = self.headers.get("x-forwarded-for", "")  # Cloud Run / Render put the real client first
        return (fwd.split(",")[0].strip() or self.client_address[0])[:64]

    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        if path == "/healthz":
            return self._send(200, {"ok": True})
        if path == "/api/status":
            return self._send(200, {"ai": has_key()})
        f = safe_path(path)
        if f:
            with open(f, "rb") as fh:
                data = fh.read()
            ext = os.path.splitext(f)[1].lower()
            etag = '"%s"' % hashlib.sha1(data).hexdigest()[:16]
            fresh = ext in (".html", ".js", ".css")   # code: always revalidate; art: cache for a day
            extra = {"etag": etag}
            if ext == ".html":
                extra["content-security-policy"] = PAGE_CSP
            elif os.path.basename(f) == "runner.js":
                extra["content-security-policy"] = RUNNER_CSP
            if self.headers.get("if-none-match") == etag:
                return self._send(304, b"", MIME.get(ext, "application/octet-stream"), "no-cache" if fresh else "public, max-age=86400", extra)
            return self._send(200, data, MIME.get(ext, "application/octet-stream"), "no-cache" if fresh else "public, max-age=86400", extra)
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/api/bug":
            return self._send(404, {"error": "not found"})
        try:
            n = int(self.headers.get("content-length", 0))
        except ValueError:
            n = -1
        if n < 0 or n > MAX_BODY:
            return self._send(413, {"ok": False, "reason": "body_too_large"})
        try:
            q = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return self._send(400, {"ok": False, "reason": "bad_json"})
        if not isinstance(q, dict):
            return self._send(400, {"ok": False, "reason": "bad_json"})
        if not has_key():
            return self._send(200, {"ok": False, "reason": "no_key"})
        diff = q.get("difficulty") if q.get("difficulty") in DIFFICULTIES else "easy"
        if not LIMITER.allow(self.client()):
            return self._send(429, {"ok": False, "reason": "rate_limited"})
        try:
            bug, why = ask_claude(diff)
        except Exception as e:  # network / parse problems: the game just keeps using its bank
            detail = e.read()[:300].decode("utf-8", "replace") if isinstance(e, urllib.error.HTTPError) else ""
            log("Claude generation failed: %s: %s %s" % (type(e).__name__, str(e)[:200], detail))
            return self._send(200, {"ok": False, "reason": "generation_failed"})
        if not bug:
            log("Claude bug rejected:", why)
            return self._send(200, {"ok": False, "reason": "invalid_shape"})
        self._send(200, {"ok": True, "bug": bug})

    def log_message(self, *a):
        pass


def main():
    port = int(os.environ.get("PORT", 8000))
    mode = "Claude writes fresh bugs (verified in the browser)" if has_key() else "built-in bug bank (set ANTHROPIC_API_KEY for Claude-written bugs)"
    log("Glitchlands on http://0.0.0.0:%d  [%s]" % (port, mode))
    ThreadingHTTPServer(("0.0.0.0", port), H).serve_forever()


if __name__ == "__main__":
    main()
