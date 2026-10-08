# Syntax Forest — Level 2 art pack

Original AI-generated raster art for Glitchlands. No Mystic Woods or Catchimon images were supplied as references. This pack does not change the current game.

## Coverage

| File | Intended layout | Use |
|---|---|---|
| terrain.png | 8 × 8 | Forest floor, paths, stream banks, canopy, cliffs and bridge textures |
| props.png | 4 × 4 | Trees, foliage, rocks, logs, hut, bridge, gates, shrine and chests |
| npcs.png | 8 × 8 | Ranger and rival; four directions with eight walk frames per direction |
| bugs.png | 8 × 8 | Beetle, moth, millipede and spectral owl; idle and capture reactions |
| effects.png | 8 × 8 | Fireflies, dust, net, corruption, restoration, splash, inventory icons and quest markers |
| battle-background.png | Single scene | Empty forest arena with two battle platforms |

The existing player, Byte, fonts, UI and audio can be reused locally. This pack does not replace every restricted Level 1 asset, supply music or sound effects, or implement the second level.

## Intended animation order

Coordinates are zero-based, counted from top left. `manifest.json` records measured image sizes and nominal frame rectangles.

- NPC rows 0–3: ranger, facing down / left / right / up. Rows 4–7: rival in the same order. Walk frames: idle, left step, passing, right step, repeated. Start with 120–160 ms per frame.
- Bug row pairs: beetle 0–1, moth 2–3, millipede 4–5, owl 6–7. First row idle, second row capture reaction. Start with 180–240 ms idle and 90–120 ms reaction.
- Effects rows 0–5: fireflies, dust, net, corruption, restoration, water splash. Rows 6–7 are stationary icons. Use 70–120 ms per VFX frame.
- Props row 2: hut, bridge, closed gate, open gate. Row 3: broken shrine, restored shrine, closed chest, open chest.

## Integration

Use `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` with nearest-neighbor rendering (`ctx.imageSmoothingEnabled = false`). These sheets use their own layouts; do not replace the existing Mystic Woods sheets by filename. Terrain is intended to render at the current 32 px world tile size; actor frames at 32–48 px; large props span multiple tiles. Add collision footprints independently of the transparent sprite frame and draw tall props in depth order.

Generated atlas alignment and animation continuity must be visually checked in-game. The generator returned 1254 × 1254 source atlases rather than the requested 1024 × 1024 sheets, so cells are not uniformly divisible into whole pixels. The manifest rounds grid boundaries and records occupied bounds; some sprites touch nominal cell edges and need registration/crop cleanup. The artwork is more detailed than the existing 16 px terrain and must be reviewed at game scale. A generated tile marked as repeatable is not a verified seamless autotile. The map renderer will need an explicit tile mapping and edge selection; this pack is not a tested drop-in replacement.

## Public repository

Keep provenance and `prompts.json` with the art. These outputs are newly generated; do not describe them as a third-party licensed pack or claim legal exclusivity. Existing Mystic Woods/Catchimon assets are not included. Resolve the remaining Level 1 asset restrictions separately before distributing the full game.

## Files

`preview.html` is a local atlas viewer with grid overlays and frame inspection. `manifest.json` is the nominal atlas specification. `validation.json` contains PNG dimension/transparency checks. `prompts.json` preserves the exact generation prompts.
