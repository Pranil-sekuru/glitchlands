# Glitchlands

A top-down pixel adventure where every wild monster is a **bug in a short JavaScript program**. Walk into tall grass, spot the buggy line, name the mistake, **fix the code and run it**, then throw the net. Built for the "Bug Hunt Arena" challenge: *AI creates the bugs, a beginner hunts them.*

- **Two regions, one quest each.** Region 1 (the Meadow Mainframe) and Region 2 (the Syntax Forest) each have a story, three repairs, a rival duel and a boss.
- **The repair is the graded skill.** Your fix runs in a sandboxed Web Worker and must print exactly what the correct program prints, including hidden tests, so a lucky guess fails.
- **Hints that teach.** Three guiding questions per bug, a "what failed" explanation from Byte, and the Prof's per-skill feedback in the Bugdex.
- **A reason to return:** a daily hunt, a Bugdex of 8 species, and a streak.
- **Claude writes new bugs** when `ANTHROPIC_API_KEY` is set; the *browser* runs the buggy and fixed programs and discards any bug that does not behave as claimed. Without a key the game uses its 38 hand-written, machine-checked bugs.

## How it meets the brief
**Challenge: "Bug Hunt Arena": AI creates the bugs, a beginner hunts them; fair bugs, hints that teach, a reason to return.**

| Metric | What the repo does |
|---|---|
| **Problem alignment** | A game loop *is* the lesson: spot the buggy line, name the mistake, **write the fix and run it**. Claude generates fresh bugs (each verified by running the buggy and the fixed program in the browser before it is shown), with a hand-checked bank as fallback. *Fair:* the fix is graded by running it against hidden tests, ambiguous labels never appear as decoys, and a wrong label costs nothing. *Hints that teach:* three guiding hints, "Ask Byte" explains the last failing run in plain words, and the Bugdex shows which kinds of bug you miss. *Reason to return:* a daily hunt, streaks, a Bugdex of 8 species, and two regions with a story. |
| **Security** | No secrets in the repo (key from the environment / a private file outside it). `/api/bug` validates input, caps body size, rate-limits per client and per day. Only whitelisted files are served. Strict CSP on every page (no inline script, same-origin only); player code runs in a worker whose own CSP is `default-src 'none'`, so it cannot touch the network. Model output is shape-checked on the server and re-verified in the browser. |
| **Efficiency** | No dependencies at all. Pages and code are gzip-compressed and revalidated with ETags; art is cached for a day. Region 1 art loads first and Region 2 streams in behind it. Art was palette-compressed (7 MB repo). World is drawn on one canvas with off-screen terrain baked once; sprites are culled to the viewport. |
| **Testing** | 458 bug-bank checks (every fix passes, every bug fails unfixed, decoys fair, hints never leak the fix), 15 server tests, 41 in-browser integration checks that play both full quests, CI on every push. |
| **Accessibility** | Landmarks, labelled canvases, live regions for dialogue and results, keyboard-operable lines and options with a visible focus ring, zoom not disabled, `prefers-reduced-motion` respected, contrast-checked colours, touch pad for phones. |
| **Code quality** | Markup, styles and scripts are separate files; data (`bugs.js`, `atlas.js`) is separate from logic; shared helpers instead of copy-paste; dead code removed; a documented provenance for all art. |

## Run
```
python3 server.py            # http://localhost:8000   (Python 3.9+, standard library only)
ANTHROPIC_API_KEY=... python3 server.py   # optional: Claude-written bugs
```
Controls: `WASD`/arrows move, `Enter`/`Space` talk, `H` hint, `B` Bugdex, `T` daily hunt. Phones get an on-screen pad.

## Test
```
npm test                                   # syntax check + bug-bank tests + server tests (no dependencies to install)
python3 -m unittest discover -s tests -v   # server only: validation, rate limits, headers, CSP, gzip, paths
node tests/bank.test.js                    # bug bank: every fix prints the expected output, the buggy code does not, decoys are fair
```
**Integration tests in the browser:** open `/selftest.html` (locally at `http://localhost:8000/selftest.html`, or on the live site). It plays the real game in a frame (its own save slot): the code sandbox, the whole Region 1 and Region 2 quests, and accessibility checks (41 checks). CI (`.github/workflows/test.yml`) runs `npm test` and checks the repo stays under 10 MB.

## Layout
| File | Purpose |
|---|---|
| `index.html` | landing page |
| `game.html` | game page (markup only) |
| `bugs.js` | the bug bank (`§` marks the buggy line) |
| `atlas.js` | sprite frame rectangles |
| `js/*.js`, `game.css` | the game, one file per feature: `core` (state, maps, input), `art`, `actors`, `meadow` (Region 1 world), `forest` (Region 2), `loop`, `dialog`, `verify` (runs player code, verifies AI bugs), `battle`, `ui` |
| `landing.js`, `landing.css` | landing page animation |
| `runner.js` | the sandboxed Web Worker that runs the player's code |
| `selftest.html`, `selftest.js` | in-browser integration tests |
| `server.py` | static server + `/api/bug` (Claude bug generator, rate-limited) |
| `tests/` | unit and integration tests |
| `assets/` | art, with provenance in `ASSETS.md` |

## Deploy (Cloud Run)
```
gcloud run deploy glitchlands --source . --region <region> --allow-unauthenticated \
  --set-secrets ANTHROPIC_API_KEY=anthropic-key:latest      # secret optional
```
The container (see `Dockerfile`) runs `python3 server.py` and honours `PORT`.

## Security notes
The API key is read only from the environment. `/api/bug` validates its input, caps request size, rate-limits per client and per day (`BHA_RATE_PER_MIN`, `BHA_DAILY_CAP`), and only serves whitelisted files. Player code runs in `runner.js`, a Web Worker with a 900 ms timeout. The server sends that file with `Content-Security-Policy: default-src 'none'`, so the *browser* blocks every network request from player code, and pages are served with a strict CSP (no inline scripts, same-origin only).
