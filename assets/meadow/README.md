# Meadow Mainframe — original Level 1 asset pack

Generated with built-in imagegen. The newly generated Level 1 map concept was the only image reference; no Mystic Woods or Catchimon files were used.

## Sheets

| File | Nominal grid | Contents |
|---|---|---|
| terrain.png | 8 × 8 | Meadow floors, encounter grass, paths, pond banks, cliffs, steps, bridge decks and paving |
| environment.png | 4 × 4 | Trees, flowers, grass, rocks, reeds, logs, sign, chest states and fence |
| village-systems.png | 4 × 4 | Lab, cottage, broken/restored lantern, pump, bell and Compiler, gate states and village furniture |
| player-byte.png | 8 × 8 | Original debugger player and original golden beetle Byte, four directions each |
| npcs.png | 8 × 8 | Professor and Nullo, four directions and eight walk frames per direction |
| villager.png | 4 × 4 | Villager, four directions and four walk frames per direction |
| bugs-a.png | 8 × 6 | Offbyonyx, Operatoad and Varmint; idle and capture reactions |
| bugs-b.png | 8 × 6 | Condibug, Returnip and Loopent; idle and capture reactions |
| effects.png | 8 × 8 | Fireflies, dust, capture, corruption, restoration, splash and game icons |
| battle-background.png | 1 × 1 | Sunny meadow battle scene with two empty platforms |

## Row order

Directions are **down, left, right, up**, one direction per row.

- Player rows 0–3; Byte rows 4–7. Eight frames per direction. Byte is smaller than the player.
- Professor rows 0–3; Nullo rows 4–7 in `npcs.png`, eight frames per direction. Villager rows 0–3 in its separate sheet, four frames per direction.
- Bugs A: Offbyonyx rows 0–1, Operatoad 2–3, Varmint 4–5. Bugs B: Condibug rows 0–1, Returnip 2–3, Loopent 4–5. First row idle; second row capture reaction.
- Effects rows 0–5: fireflies, dust, net, corruption, restoration, splash. Rows 6–7: stationary icons.

Quest states, zero-based `[column,row]`:

- Lantern broken `[2,0]`, restored `[3,0]`.
- Pump broken `[0,1]`, restored `[1,1]`.
- Bell broken `[2,1]`, restored `[3,1]`.
- Gate closed `[0,2]`, open `[1,2]`.
- Compiler broken `[2,2]`, restored `[3,2]`.

## Integration and limits

These are source art atlases, not replacements with the same layout as the existing sheets. `manifest.json` measures source dimensions and rounds nominal grid boundaries. Use its rectangles with `drawImage` and disable smoothing. `atlas-loader.js` demonstrates loading and drawing a cell without assuming every source cell is evenly divisible into whole pixels.

Review frame registration, occupied edges, animation continuity and terrain seams before integration. Generated artwork can be more detailed than native 16 px terrain; test the final 32 px world tiles and 32–48 px characters for readability. Keep collision footprints separate from transparent art and depth-sort trees and buildings. Baseline anchors in the loader are nominal and must be tuned when a sprite drifts.

The game has not been modified. The original player and Byte sheets supplied here give you replacements to work from, but the existing code and landing page still use the old art until explicitly integrated. No music or sound effects are included.

The exact generation prompts and reference provenance are in `prompts.json`. Keep them with the art. This pack does not grant rights to the existing third-party asset packs or claim legal exclusivity for generated images.
