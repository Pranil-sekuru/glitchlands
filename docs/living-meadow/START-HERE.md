# Give Claude this folder

Read **CLAUDE-HANDOFF.md** first. It specifies every grid convention, collider, NPC route, door placement, sprite frame and animation timing. `level1-grid.json` is the machine-readable placement manifest. Open `grid-preview.html` to inspect the map with collision cells and patrol routes. `door-atlas.json` describes the new door sprite sheet.

The code in `js/life.js` and `integration.patch` implements the sample behavior. Merge the patch into the current project; do not replace unrelated changes. Existing assets in this kit are reference copies. The only new bitmap is `assets/meadow/door-animation.png`.

Claude prompt:

> Implement this Living Meadow kit in the current Glitchlands project. Follow CLAUDE-HANDOFF.md and level1-grid.json for zero-based tile placements and physics. Preserve the existing painted map, saves, house logic, companion behavior, quest flow and Level 2. Merge integration.patch carefully, use measured existing sprite rectangles from atlas.js, and add the new door PNG and life.js. Keep the lab/cottage cosmetic until real interiors exist. Do not open the decorative palisade without a defined grid route. Run tests/life.test.js and manually verify movement, home doors, walking NPC collision, repairs and the falling area title using ?save=claude-life-test. Report exactly which checks were performed.
