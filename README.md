# Glitchlands

A top-down pixel adventure where every wild monster is a **bug in a short program, written in JavaScript, Python or Lua**. You wake up at home, walk to Prof. Semicolon's lab and **pick a partner who speaks one language**. Then walk into tall grass, spot the buggy line, name the mistake, **fix the code and run it**, and throw the net. Built for the "Bug Hunt Arena" challenge: *AI creates the bugs, a beginner hunts them.*

- **Partners and language types.** Byte speaks JavaScript, Pip Python, Luna Lua. A Bug in your partner's language gets all three hints, a full explanation of every failed run and one extra try; any other language gets one hint. Catch your first Bug in a new language and that language's partner joins your team.
- **Real code in three languages.** Fixes run in the browser: JavaScript in a Web Worker, Python in [Pyodide](https://pyodide.org) (CPython compiled to WebAssembly) and Lua in [Fengari](https://fengari.io), all served from this site with no network access for player code.
- **Plays on any screen.** On a computer the game fills the window; on a phone held upright it becomes a handheld console (screen on top, D-pad, A/B, START/SELECT); held sideways, the controls move to the sides. Everything inside the game screen scales with it.

- **Two regions, one quest each.** Region 1 (the Meadow Mainframe) and Region 2 (the Syntax Forest) each have a story, three repairs, a rival duel and a boss.
- **The repair is the graded skill.** Your fix runs in a sandboxed Web Worker and must print exactly what the correct program prints, including hidden tests, so a lucky guess fails.
- **Hints that teach.** Three guiding questions per bug, a "what failed" explanation from Byte, and the Prof's per-skill feedback in the Bugdex.
- **A reason to return:** a daily hunt, a Bugdex of 8 species, and a streak.
- **An AI writes new bugs** when a key is set: an open-weight model such as GPT-OSS 120B on Groq (`LLM_API_KEY`) or Claude (`ANTHROPIC_API_KEY`); the *browser* runs the buggy and fixed programs and discards any bug that does not behave as claimed. Without a key the game uses its 60 hand-written, machine-checked bugs (38 JavaScript, 11 Python, 11 Lua). AI-written bugs are JavaScript.

## How it meets the brief
**Challenge: "Bug Hunt Arena": AI creates the bugs, a beginner hunts them; fair bugs, hints that teach, a reason to return.**

| Metric | What the repo does |
|---|---|
| **Problem alignment** | A game loop *is* the lesson: spot the buggy line, name the mistake, **write the fix and run it**. Claude generates fresh bugs (each verified by running the buggy and the fixed program in the browser before it is shown), with a hand-checked bank as fallback. *Fair:* the fix is graded by running it against hidden tests, ambiguous labels never appear as decoys, and a wrong label costs nothing. *Hints that teach:* three guiding hints, "Ask Byte" explains the last failing run in plain words, and the Bugdex shows which kinds of bug you miss. *Reason to return:* a daily hunt, streaks, a Bugdex of 8 species, and two regions with a story. |
| **Security** | No secrets in the repo (key from the environment / a private file outside it). `/api/bug` validates input, caps body size, rate-limits per client and per day. Only whitelisted files are served. Strict CSP on every page (no inline script, same-origin only); player code runs in a worker whose own CSP is `default-src 'none'`, so it cannot touch the network. Model output is shape-checked on the server and re-verified in the browser. |
| **Efficiency** | No dependencies at all. Pages and code are gzip-compressed and revalidated with ETags; art is cached for a day. Region 1 art loads first and Region 2 streams in behind it. Art was palette-compressed (7 MB repo). World is drawn on one canvas with off-screen terrain baked once; sprites are culled to the viewport. |
| **Testing** | 766 bug-bank checks (every JavaScript and Lua fix passes, every bug fails unfixed, decoys fair, hints never leak the fix), every Python bug run through CPython, 17 server tests, 64 in-browser integration checks (the opening, the starter choice, the Python and Lua sandboxes, both full quests in all three languages), CI on every push. |
| **Accessibility** | Landmarks, labelled canvases, live regions for dialogue and results, keyboard-operable lines and options with a visible focus ring, zoom not disabled, `prefers-reduced-motion` respected, contrast-checked colours, touch pad for phones. |
| **Code quality** | Markup, styles and scripts are separate files; data (`bugs.js`, `atlas.js`) is separate from logic; shared helpers instead of copy-paste; dead code removed; a documented provenance for all art. |

## Run
```
python3 server.py            # http://localhost:8000   (Python 3.9+, standard library only)
LLM_API_KEY=... python3 server.py         # optional: bugs written by GPT-OSS 120B (open-weight) on Groq (or put the key in ~/.llm_key)
LLM_BASE_URL=... LLM_MODEL=... LLM_API_KEY=... python3 server.py   # any other OpenAI-compatible host (OpenRouter, Together, Ollama...)
ANTHROPIC_API_KEY=... python3 server.py   # or Claude-written bugs
```
Controls: `WASD`/arrows move, `Enter`/`Space` talk, `H` hint, `M` (or `B`) team & Bugdex, `T` daily hunt. On a phone: D-pad, A (talk / choose), B (back), START (team & Bugdex), SELECT (hint). Add `?layout=gb`, `?layout=gba` or `?layout=desk` to the URL to force a layout.

**Dev mode** (the 🛠 Dev mode button on the title page, `?dev=1`, or press `` ` `` to toggle): every hunt opens on the fix step with unlimited tries and no net throw, an ⚡ AUTO-FIX button runs the textbook fix, and 🛠 SKIP TO FOREST completes Region 1. It uses its own save slot (`gl1-dev`), so real progress is untouched.

## Test
```
npm test                                   # syntax check + bug-bank tests + server tests (no dependencies to install)
python3 -m unittest discover -s tests -v   # server (validation, rate limits, headers, CSP, gzip, paths) + every Python bug run through CPython
node tests/bank.test.js                    # bug bank: every JavaScript and Lua fix prints the expected output, the buggy code does not, decoys are fair
```
**Integration tests in the browser:** open `/selftest.html` (locally at `http://localhost:8000/selftest.html`, or on the live site). It plays the real game in a frame (its own save slot): the three code sandboxes, a new game from the house to the starter choice, the whole Region 1 and Region 2 quests, and accessibility checks (64 checks). CI (`.github/workflows/test.yml`) runs `npm test` and checks the repo stays under 40 MB.

## Layout
| File | Purpose |
|---|---|
| `index.html` | landing page |
| `game.html` | game page (markup only) |
| `bugs.js` | the bug bank (`§` marks the buggy line) |
| `atlas.js` | sprite frame rectangles |
| `js/*.js`, `game.css` | the game, one file per feature: `layout` (desktop / handheld / sideways), `core` (state, maps, input), `art`, `actors`, `pets` (partners, team, starter choice), `house` (interiors: the two-storey home where a new game starts, the lab, the cottage), `physics` (free movement, smooth collision), `life` (walking villagers, doors, ambience), `meadow` (Region 1 world), `forest` (Region 2), `loop`, `dialog`, `verify` (runs player code in each language, verifies AI bugs), `battle`, `ui` |
| `landing.js`, `landing.css` | landing page animation |
| `runner.js`, `runner-py.js`, `runner-lua.js` | the sandboxed Web Workers that run the player's JavaScript, Python and Lua |
| `vendor/` | Pyodide 0.26.4 (Python) and Fengari 0.1.4 (Lua), served from this site; versions and licences in `vendor/README.md` |
| `selftest.html`, `selftest.js` | in-browser integration tests |
| `server.py` | static server + `/api/bug` (AI bug generator: an open model or Claude, rate-limited) |
| `tests/` | unit and integration tests |
| `assets/` | art, with provenance in `ASSETS.md` |

## Deploy (Cloud Run)
```
gcloud run deploy glitchlands --source . --region <region> --allow-unauthenticated \
  --set-secrets ANTHROPIC_API_KEY=anthropic-key:latest      # secret optional
```
The container (see `Dockerfile`) runs `python3 server.py` and honours `PORT`.

## Security notes
The API key is read only from the environment. `/api/bug` validates its input, caps request size, rate-limits per client and per day (`BHA_RATE_PER_MIN`, `BHA_DAILY_CAP`), and only serves whitelisted files. Player code runs in a Web Worker with a timeout: `runner.js` (JavaScript) is sent with `Content-Security-Policy: default-src 'none'`, so the *browser* blocks every network request. `runner-py.js` may only load this site's own Python runtime; once loaded it deletes every network API and blocks Python's `js` bridge. `runner-lua.js` loads only the vendored Fengari and runs each program in a fresh Lua state without `io`, `os`, `package`, `require` or `js`. Pages are served with a strict CSP (no inline scripts, same-origin only).
