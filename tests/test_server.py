"""Server tests (standard library only).  Run:  python3 -m unittest discover -s tests -v"""
import json
import os
import sys
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import server  # noqa: E402

GOOD = {
    "title": "Coin Counter", "task": "Add the coins.", "code": "let t = 0;\nfor (const c of [1, 2]) {\n  t = c;\n}\nconsole.log(t);",
    "bug_line": 3, "category": "wrong-operator", "expected": "3", "actual": "2", "out": ["3"],
    "hints": ["a?", "b?", "c?"], "fix": "t += c;", "explanation": "= replaces. += adds.", "extra": "",
}


class Validate(unittest.TestCase):
    def test_accepts_good(self):
        bug, why = server.validate(dict(GOOD))
        self.assertIsNone(why)
        self.assertEqual(bug["bug_line"], 3)

    def test_rejects_bad_shapes(self):
        cases = {
            "bug_line": 99, "category": "nope", "out": [], "hints": ["only one"], "fix": "a\nb", "title": "",
        }
        for key, val in cases.items():
            d = dict(GOOD); d[key] = val
            self.assertIsNone(server.validate(d)[0], key)
        d = dict(GOOD); del d["code"]
        self.assertEqual(server.validate(d), (None, "missing field"))
        self.assertIsNone(server.validate("x")[0])
        d = dict(GOOD); d["bug_line"] = True
        self.assertIsNone(server.validate(d)[0])

    def test_extra_may_only_print(self):
        d = dict(GOOD); d["extra"] = "console.log(f(1));\nconsole.log(f(2));"
        self.assertIsNone(server.validate(d)[1])
        for bad in ("fetch('http://x')", "console.log(1);\nwhile(true){}", "console.log(1)\n" * 5):
            d = dict(GOOD); d["extra"] = bad
            self.assertIsNotNone(server.validate(d)[1], bad)


class Parsing(unittest.TestCase):
    def test_extract_json_tolerates_fences_prose_and_raw_newlines(self):
        raw = 'Sure!\n```json\n{"code": "a\nb", "n": 1}\n```'
        self.assertEqual(server.extract_json(raw), {"code": "a\nb", "n": 1})
        with self.assertRaises(ValueError):
            server.extract_json("no json here")

    def test_reply_text_joins_only_text_blocks(self):
        resp = {"content": [{"type": "thinking", "thinking": "hm"}, {"type": "text", "text": "{"}, {"type": "text", "text": "}"}]}
        self.assertEqual(server.reply_text(resp), "{}")


class Limits(unittest.TestCase):
    def test_per_minute_and_daily_caps(self):
        now = [1000.0]
        lim = server.Limiter(2, 3, clock=lambda: now[0])
        self.assertTrue(lim.allow("a")); self.assertTrue(lim.allow("a"))
        self.assertFalse(lim.allow("a"))          # per-client minute cap
        self.assertTrue(lim.allow("b"))           # other clients unaffected
        self.assertFalse(lim.allow("c"))          # daily cap (3) reached
        now[0] += 86400
        self.assertTrue(lim.allow("a"))           # new day resets
        now[0] += 61
        self.assertTrue(lim.allow("a"))           # window slides


class Paths(unittest.TestCase):
    def test_only_public_files(self):
        self.assertTrue(server.safe_path("/").endswith("index.html"))
        self.assertTrue(server.safe_path("/game.html").endswith("game.html"))
        self.assertTrue(server.safe_path("/bugs.js").endswith("bugs.js"))
        for bad in ("/server.py", "/../server.py", "/assets/../server.py", "/assets/%2e%2e/server.py", "/tests/test_server.py", "/nope.html"):
            self.assertIsNone(server.safe_path(bad), bad)


class Http(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.H)
        cls.base = "http://127.0.0.1:%d" % cls.httpd.server_address[1]
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()

    def call(self, path, data=None, headers=None):
        req = urllib.request.Request(self.base + path, data, headers or {})
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                return r.status, r.read(), r.headers
        except urllib.error.HTTPError as e:
            return e.code, e.read(), e.headers

    def post(self, body, headers=None):
        return self.call("/api/bug", body if isinstance(body, bytes) else json.dumps(body).encode(), headers or {"content-type": "application/json"})

    def test_pages_assets_and_health(self):
        self.assertEqual(self.call("/healthz")[0], 200)
        code, body, h = self.call("/")
        self.assertEqual(code, 200); self.assertIn(b"Glitchlands", body)
        self.assertEqual(h["x-content-type-options"], "nosniff")
        self.assertEqual(self.call("/assets/forest/npcs.png")[2]["content-type"], "image/png")
        self.assertEqual(self.call("/server.py")[0], 404)
        self.assertEqual(self.call("/assets/..%2fserver.py")[0], 404)

    def test_status_reflects_key(self):
        with mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "x"}):
            self.assertEqual(json.loads(self.call("/api/status")[1]), {"ai": True})
        with mock.patch.dict(os.environ, {"BHA_KEY_FILE": "/nonexistent"}, clear=True):
            self.assertEqual(json.loads(self.call("/api/status")[1]), {"ai": False})

    def test_bug_endpoint_input_validation(self):
        with mock.patch.dict(os.environ, {"BHA_KEY_FILE": "/nonexistent"}, clear=True):
            self.assertEqual(json.loads(self.post({})[1])["reason"], "no_key")
        self.assertEqual(self.post(b"not json")[0], 400)
        self.assertEqual(self.post(b"[1,2]")[0], 400)
        self.assertEqual(self.post(b"x" * 5000)[0], 413)
        self.assertEqual(self.call("/api/other", b"{}")[0], 404)

    def test_bug_endpoint_success_failure_and_rate_limit(self):
        with mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "x"}):
            with mock.patch.object(server, "LIMITER", server.Limiter(2, 100)):
                with mock.patch.object(server, "ask_claude", return_value=(dict(GOOD), None)) as ask:
                    code, body, _ = self.post({"difficulty": "bogus"})
                    self.assertTrue(json.loads(body)["ok"])
                    ask.assert_called_with("easy")                 # unknown difficulty falls back to easy
                with mock.patch.object(server, "ask_claude", side_effect=RuntimeError("boom")):
                    self.assertEqual(json.loads(self.post({})[1])["reason"], "generation_failed")
                self.assertEqual(self.post({})[0], 429)            # third call in the minute
            with mock.patch.object(server, "LIMITER", server.Limiter(5, 100)):
                with mock.patch.object(server, "ask_claude", return_value=(None, "bad category")):
                    self.assertEqual(json.loads(self.post({})[1])["reason"], "invalid_shape")

    def test_security_headers_and_sandbox_policy(self):
        _, _, h = self.call("/game.html")
        csp = h["content-security-policy"]
        self.assertIn("script-src 'self'", csp)
        self.assertNotIn("unsafe-inline'; img", csp.split("style-src")[0])   # no inline scripts
        self.assertIn("object-src 'none'", csp)
        _, _, rh = self.call("/runner.js")
        self.assertEqual(rh["content-security-policy"], "default-src 'none'; script-src 'unsafe-eval'")   # player code: no network at all
        self.assertEqual(h["x-content-type-options"], "nosniff")

    def test_no_inline_script_or_handlers_in_pages(self):
        import re
        for page in ("/", "/game.html", "/playtest.html"):
            body = self.call(page)[1].decode()
            self.assertEqual(re.findall(r"<script(?![^>]*\bsrc=)[^>]*>", body), [], page)
            self.assertEqual(re.findall(r"\son(?:click|load|error|keydown)=", body), [], page)

    def test_gzip_etag_and_revalidation(self):
        code, body, h = self.call("/game.js", None, {"Accept-Encoding": "gzip"})
        self.assertEqual((code, h["content-encoding"]), (200, "gzip"))
        import gzip
        self.assertIn(b"function runCode", gzip.decompress(body))
        self.assertEqual(self.call("/game.js", None, {"If-None-Match": h["etag"]})[0], 304)
        self.assertEqual(h["cache-control"], "no-cache")
        self.assertIn("max-age", self.call("/assets/forest/npcs.png")[2]["cache-control"])

    def test_source_files_are_not_served(self):
        for p in ("/server.py", "/Dockerfile", "/tests/test_server.py", "/README.md", "/.gitignore"):
            self.assertEqual(self.call(p)[0], 404, p)


if __name__ == "__main__":
    unittest.main()
