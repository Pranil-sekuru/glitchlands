"""Python bug-bank tests: every Python bug's fixed program prints exactly `out`, and the buggy one does not.
Run: python3 -m unittest discover -s tests -v   (needs node or JavaScriptCore to read bugs.js; skipped otherwise)
The game runs these programs with Pyodide (CPython compiled to WebAssembly), so the local python3 gives the same output.
"""
import json
import os
import shutil
import subprocess
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"
DUMP = 'const {BANK} = new Function(SRC + "\\n;return {BANK};")(); OUT(JSON.stringify(BANK.filter(b => b.lang === "py")));'


def python_bugs():
    with open(os.path.join(ROOT, "bugs.js")) as f:
        src = f.read()
    script = "const SRC = %s; %s" % (json.dumps(src), DUMP)
    if shutil.which("node"):
        res = subprocess.run(["node", "-e", script.replace("OUT(", "console.log(")], capture_output=True, text=True, timeout=30)
    elif os.path.exists(JSC):
        res = subprocess.run([JSC, "-e", script.replace("OUT(", "print(")], capture_output=True, text=True, timeout=30)
    else:
        return None
    return json.loads(res.stdout)


def run(code):
    try:
        r = subprocess.run([sys.executable, "-I", "-c", code], capture_output=True, text=True, timeout=3)
    except subprocess.TimeoutExpired:
        return False, []
    return r.returncode == 0, r.stdout.splitlines()


class PythonBank(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bugs = python_bugs()
        if cls.bugs is None:
            raise unittest.SkipTest("needs node or JavaScriptCore to read bugs.js")

    def test_enough_python_bugs(self):
        self.assertGreaterEqual(len(self.bugs), 9)

    def test_fix_prints_out_and_bug_does_not(self):
        for b in self.bugs:
            with self.subTest(b["title"]):
                lines = b["code"].split("\n")
                fixed = lines[:]
                bl = b["bug_line"] - 1
                fixed[bl] = lines[bl][: len(lines[bl]) - len(lines[bl].lstrip())] + b["fix"].strip()
                extra = "\n" + b["extra"] if b.get("extra") else ""
                ok, out = run("\n".join(fixed) + extra)
                self.assertTrue(ok, "fixed program crashed")
                self.assertEqual(out, b["out"])
                ok, out = run(b["code"] + extra)
                self.assertFalse(ok and out == b["out"], "buggy program already prints `out`")


if __name__ == "__main__":
    unittest.main()
