# Glitchlands · Living Meadow Mainframe

Implement animation and interaction layers over the existing Level 1 painting. Preserve the painting, quest progression, saved games, house, companion logic and Level 2. Use `level1-grid.json` as placement data and `grid-preview.html` as the visual guide. A tested integration patch and `js/life.js` are included. This kit extends the existing project; it is not a standalone game.

## Coordinates — do not guess from the painting

| Property | Value |
|---|---|
| Logical grid | 32 columns × 24 rows, zero-based |
| Logical tile | 32 × 32 world pixels |
| World | 1024 × 768 world pixels |
| Painting | 1448 × 1086 image pixels |
| Painting tile pitch | 45.25 image pixels in both axes |
| Origin and axes | Top-left; X right; Y down |
| Array indexing | `M[y][x]`, not `M[x][y]` |

A tile `[x,y]` spans world `[x*32,y*32,32,32]`. Its painted-image rectangle is `[x*45.25,y*45.25,45.25,45.25]`. A visual foot anchor `[fx,fy]` is a fractional tile position: multiply by 32 for world pixels or 45.25 for original image pixels. These coordinate systems are distinct from canvas backing-store pixels, CSS pixels and camera offsets.

The full 24-row collision grid is in `level1-grid.json`, copied from `js/core.js`. Use that grid for physics; decorative trees, roofs and paths in the painting do not define collision themselves. The painting is a single background and has no independently animated objects. Layer live sprites over it.

## Placements

| Object | Physics / interaction | Visual foot anchor in tiles |
|---|---|---|
| Professor | `[4,5]` (solid `P`; face it and press Enter) | `[4.75,5.60]` |
| Home entrance | `[18,6]` (`H`; step onto it) | Door `[18.22,6.91]` |
| Home exterior arrival | `[18,7]`, facing down | Player uses normal tile feet |
| Laboratory doorway | Cosmetic opening; no lab interior | `[3.96,4.02]` |
| Small cottage doorway | Cosmetic opening; no cottage interior | `[14.58,5.04]` |
| Lantern repair | `[5,8]`, `[5,9]` (`1`) | `[5.64,10.20]`, width 1.55 tiles |
| Pump repair | `[13,13]`, `[14,13]`, `[15,13]`, `[12,14]` (`2`) | `[13.70,14.75]`, width 2.8 tiles |
| Bell repair | `[12,5]` (`3`) | `[12.04,6.45]`, width 2.7 tiles |
| Village sign | `[10,12]` (`s`) | Keep the existing painted sign |
| Nullo | `[28,10]` (`N`) | Existing actor renderer |
| Meadow Compiler | `[27,4]` (`C`) | Existing painting / repair effect |
| Forest exit | `[29,1]` (`x`, changed to `X` by quest) | Existing trail effect |
| Return from forest | `[29,2]` | Existing placement logic |

Large repair sprites intentionally have visual anchors different from their interaction cells. Do not replace interaction cells with the visual anchors. The palisade at approximately `[22.18,8.68]` has spare door art, but no new trigger, open passage or collision change is supplied for it. Keep it decorative until its gameplay purpose and walkable cells are defined.

## Home interior

Region 0 is 10 × 8 tiles, with its own grid in `js/house.js`. New-game spawn is `[2,3]`; enter-home arrival is `[4,6]` facing up. The exit cells are `[4,7]` and `[5,7]`, both `O`. Step onto either to open the door, wait for the opening, then return to Region 1 at `[18,7]`. Interior door animation is centered at `[5,7.6]` with a whole-cell draw size of 36.8 world pixels. Do not substitute the Meadow collision grid while indoors.

## Villagers and patrols

| NPC | Initial feet | Initial direction | Loop of tile waypoints | Look |
|---|---|---|---|---|
| V1 | `[14.74,6.72]` | Down | `[14,6] → [14,7] → repeat` | Green |
| V2 | `[13.66,7.52]` | Down | `[13,7] → [13,6] → [12,6] → [12,7] → repeat` | Blue |
| V3 | `[12.70,7.52]` | Down | `[12,7] → [11,7] → [11,6] → [12,6] → repeat` | Red |
| V4 | `[11.50,14.95]` | Right | Stationary at `[11,14]`; occasionally look around | Blue |

The pump keeper previously stood on `[12,14]`, a repair tile. The live version stands on the adjacent path `[11,14]`. Do not put it back on the repair collider. The three original `V` cells remain in the source grid as historical markers, but no longer block terrain movement by themselves. Live NPC feet supply their collision instead; otherwise old positions become invisible walls.

NPC speed is **0.85 tiles per second**. Waypoint foot targets are `[tileX+0.5,tileY+0.95]`. Startup waits are 900, 1510, 2120 and 2730 ms. Arrival pauses are `1300 + index*180` ms. Direction indices are 0 up, 1 right, 2 down, 3 left. Frame rate is one frame per 140 ms while walking; stop on frame 0 while idle. The stationary keeper turns about every 2 seconds.

Each moving NPC reserves its current foot tile (`floor(x),floor(y-0.05)`) and destination. Before moving, check terrain, player current tile, player destination while stepping, and other NPC reservations. On obstruction, wait 400 ms and retry. Pause patrols during dialogue, battle, team screens, starter choice and door travel. Face the player and pause after conversation. Do not let an NPC push the player, change quest colliders or spawn on a repair cell. Sort character draw calls by foot Y so a lower character appears in front.

## Sprite assets and frame selection

`assets/meadow/door-animation.png` is a new transparent 1254 × 1254 atlas. It has **four rows × four columns**, with 313.5 × 313.5 source cells. Fractional source rectangles are intentional; do not round them progressively and create cumulative drift. `door-atlas.json` supplies its layout.

Rows: 0 home, 1 laboratory, 2 cottage, 3 spare double palisade gate. Columns: 0 closed, 1 opening about 35°, 2 opening about 70°, 3 open. Keep the full source cell, including transparent margins, and anchor its bottom center. Draw whole cells as squares: home 26.4 world pixels, lab 29.76, cottage 24.0. Do not auto-trim each animation frame separately because this makes the door frame jump.

Draw door overlays at their visual anchors above the background, below people. The implementation returns to the original painted closed doorway when idle. Open frames have an opaque dark interior covering the painted door. Check alignment at each scale; these are generated art frames, not guaranteed hand-authored pixel registrations. A larger, independently traversable gate would also need a matching ground patch beneath the original painted closed gate.

The existing `assets/meadow/villager.png` supplies walking sprites. **Use the measured rectangles from `atlas.js` (`MR.vil`), not an assumed uniform 4 × 4 crop.** Generated sheet margins vary. The actual direction-to-row mapping is `FROW=[3,2,0,1]`: up→row3, right→row2, down→row0, left→row1. Reuse `actor()` and `villagerLook()`; green, blue and red clothes are runtime recolors. Draw at the existing 44-world-pixel actor height. `assets/forest/npcs.png` is included because the existing hero renderer uses it. Preserve its measured atlas rectangles too.

`environment.png` supplies fern and grass cutouts through `MR.env[7]` and `[9]`. Animated water ripples and chimney smoke are canvas effects and need no extra textures. Plant foot anchors and atlas indices are in the JSON. Decorative plants have no collider. They sway around the bottom center by ±0.045 radians; widths are 23 world pixels. Smoke originates at `[2.42,1.07]`. Ripples appear only on `~` water cells. Reduce or disable these effects under `prefers-reduced-motion`.

## Door state machine and physics

Player movement stays cardinal and tile-based: 150 ms per tile, 80 ms delay when turning. Cap simulation dt at 64 ms after a suspended tab. Keep tile occupancy and interpolated rendering separate. No gravity or platform physics is appropriate for this top-down map.

Door states: **idle → opening (560 ms) → travel once → closing (560 ms) → idle**. On opening, set `mode='door'`, clear held movement keys and reject duplicate open triggers. Resolve the travel callback once, then restore walk mode before the callback; the callback may intentionally change to dialogue. Closing is cosmetic and must not overwrite that mode. Reduced-motion doors use 100 ms per phase. Keep the canvas loop running while movement is locked.

Only the home door changes regions. Lab/cottage openings end with a short dialogue. For them, the sample implementation checks a doorway within 1.6 tiles of the player's feet and a faced `L` or `T` cell. A future interior must supply its own collision map, spawn, exit and save handling before turning one of these into a portal. Do not make decorative `T` cells walkable as a shortcut.

## Falling area title

Use a DOM overlay inside `#screen`, separate from world coordinates. No box; centered warm-white serif title with subtle dark shadow and small spaced subtitle. Position at 24% of the game screen height; pointer events disabled.

One 3.8-second animation: start 75 px above resting position and transparent; drop to 5 px below at 16%; settle at 23%; hold through 79%; fade and lift 12 px by 100%. Reduced motion uses opacity only. Announce HOME, MEADOW MAINFRAME or SYNTAX FOREST on region entry, and never restart the same title on every render or canvas resize. Use `aria-live='polite'`.

Meadow subareas: Compiler Hill (`x≥25,y≤10`), Willow Creek (`x≤9,12≤y≤18`), Tallgrass Meadow (`x≥11,y≥10`), Village Square (`10≤x≤15,y≤9`), evaluated in that order. Require 650 ms in a zone and an 8-second cooldown before another title. Hide the overlay during battle, starter selection and the dex.

## Integration and verification

1. Work from the current `/Users/pranilsekuru/bug-hunt-arena` build. Back it up first. Read `integration.patch`; do not replace newer files wholesale. `baseline-hashes.json` identifies the source versions used to create the patch.
2. Apply the patch with `patch -p1 --dry-run < integration.patch`, then `patch -p1 < integration.patch` if it applies cleanly. Add `js/life.js`, the new door PNG and `tests/life.test.js` at the same relative paths. Do not recopy the painting or existing sprite sheets over newer art.
3. Script order: `meadow.js` → `life.js` → `loop.js`; `life.js` relies on core constants and `VILLAGERS`. `setRegion()` calls `regionTitle(n)` after setting `S.region`.
4. Run `node tests/life.test.js` in the game folder. Nine checks cover grid dimensions, valid NPC placements, player obstruction, destination reservations, dialogue pause, door locking/reentrancy/timing, reduced motion, title deduplication and a two-minute patrol simulation.
5. Manually test with a separate save, `game.html?save=claude-life-test`: leave home, watch the title drop/hold/fade, re-enter, talk to a walking NPC, stand in a patrol destination, interact with all repair systems, then check the forest transition. Keep the ordinary save untouched.
6. Confirm that door image load failure still allows travel, reduced motion disables ambient sway, and resizing does not restart the arrival animation. Check mobile text readability and frame rate after integration.

The supplied prototype was manually checked for home exit/re-entry, village rendering and the area title. The nine targeted automated checks pass. This is not a claim that every quest or battle in the existing game has been tested. The spare palisade is an asset, not an implemented passage.

## Provenance

The new door atlas was generated specifically for this game from its current map reference. Existing meadow/forest files are reused from the project's current generated-art build; its `ASSETS.md` records their provenance. This kit does not bundle the retired Mystic Woods or Catchimon packs. Keep existing provenance documents when assembling a repository and review its final contents before publishing.
