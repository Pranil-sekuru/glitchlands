# Art provenance

All art in this repo is **original, AI-generated** for Glitchlands. Nothing is taken from Nintendo, The Pokémon Company or any third-party asset pack.

| Folder | Used for | Provenance |
|---|---|---|
| `assets/meadow/` | Region 1 (Meadow Mainframe): terrain, village buildings and systems, the player, Byte, Professor Semicolon, Nullo, villager, six Bug species, effects, battle arena | Generated from the prompts in `assets/meadow/prompts.json`; the pack README is `assets/meadow/README.md`. Only a concept image of the level was used as a reference. |
| `assets/meadow/meadow-map.jpg` | The whole Region 1 map, one painting (32x24 tiles) | Generated from `generation-prompt.txt` (kept outside the repo); the numbered markers and the baked-in characters were painted out by covering them with props from `village-systems.png`/`environment.png` and cloning nearby ground. The walkable grid lives in `js/core.js`. |
| `assets/forest/` | Region 2 (Syntax Forest): terrain, props, ranger/rival NPCs, four Bug species, effects, battle arena | Generated from the prompts in `assets/forest/prompts.json`; pack notes in `assets/forest/README.md`. |

Keep the `prompts.json` files with the art. This repo does not claim legal exclusivity over generated images.

## Processing done to the generated files
- Sprite sheets were reduced to 256-colour indexed PNGs (no visible change) and the two opaque scenes per pack (terrain, arena) saved as JPEG, to keep the repository under 10 MB. The untouched originals are not included.
- `atlas.js` holds the measured frame rectangles for every sprite sheet (the generated atlases are not on a clean grid).

## Earlier art
Earlier prototypes used the "Mystic Woods" free pack (non-commercial, no redistribution) and Kenney packs. None of them is used or included any more.
