# Glitchlands: playtest protocol (3 players, no coaching)

**Goal of this round:** can a newcomer finish Region 1 unaided in about 15 minutes, and do they want more?

## Setup
1. `python3 server.py`, open http://localhost:8000 on a laptop, fullscreen. Use a fresh browser profile (or clear site data) per player so the log is clean: the game saves in the browser.
2. Pick people who **have not seen the game** and are new to coding or only just starting. One person at a time.
3. Say only: *"Play this. Think out loud. I can't help, and I can't answer questions about how it works."* Then stay quiet.

## What you do while they play
- Start a timer. Write the time at each milestone: Prof talked to / first fix attempted / 1st, 2nd, 3rd system fixed / Nullo beaten / Compiler repaired.
- Note, with the time, every moment they: **freeze** (>20 s doing nothing), **guess** (clicking lines or labels at random), **ask a question aloud**, **get frustrated**, **laugh or smile**, or **try something unexpected**.
- Do NOT answer. If they quit, note when and why they say they quit.

## After they finish or quit (ask, don't lead)
1. "In your own words, what was the game asking you to do?"
2. "What was the most confusing moment?"
3. "Was there a moment you felt clever?"
4. "Would you play another region? What would you want in it?" (Watch for hesitation: a polite yes is weaker than asking when the next one is out.)

## Read the log
Open http://localhost:8000/playtest.html in the same browser right after each player. It lists every hunt with wrong lines, failed runs, hints, Byte asks and outcome, and flags where they struggled.

## Decide
| Signal | Meaning | Fix first |
|---|---|---|
| Quit before the 3rd system | opening isn't pulling them | the first 3 minutes |
| Many wrong lines on one bug | the Expected/Got clue isn't clear | that bug's text or hints |
| Many failed runs, no Byte asks | Byte isn't discoverable | make Byte more visible |
| Failed runs with Byte asks, still stuck | Byte's explanation isn't helping | rewrite the explanation |
| Finish, then "that was fun" but no ask for more | no hook | the ending, then Region 2's teaser |

**Success for this round:** 2 of 3 finish unaided in under ~20 minutes and at least 1 asks for more.

## Round 2: Syntax Forest
After a player finishes the village, watch the south road: do they notice it opens? Then note the same moments in the forest (the 3 repairs can be done in any order; the bridge is the only way east; Nullo guards the gate). `playtest.html` logs forest hunts exactly like village ones.
