# TWD (working title)

An original zombie-outbreak survival game about people. You wake up in the small town of Limon on the first morning of the outbreak. About seventy townspeople have their own families, memories and opinions, and they make their own choices: they form camps, trade, feud, fall in love, split apart and raid each other whether or not you're there.

The whole game is one HTML page (three.js for the world view). It runs as a claude.ai Artifact, or by opening `dist/index.html` in a browser.

## What's in v3

- One screen: the world fills the window, with time and place, the map, your body and your options laid over it. Panels slide in from the side.
- Houses and shops have rooms, doors and furniture. Walk in, and the walls and roof cut away so you can see inside. Search drawers, closets, fridges and shelves.
- A block grid inventory: every item takes up space. Clothes have pockets, bags and rigs add grids, and you drag, turn and stack things between them.
- Click a person and a talk box opens beside them. When the page runs on claude.ai, Claude writes what each person says in their own voice, using the player's Claude usage. The game's own rules still decide what they do, and the built-in lines take over when Claude isn't available.
- Separate female and male body models, and a character creator with build, hair, beard and skin.
- Doors that lock, get knocked on, pried, kicked in and boarded up. The dead can't open doors but they can break them down.

## Layout

- `src/` holds the parts of the page, assembled in the order listed in `src/ORDER`:
  - `00_head.html`: title, fonts, all the styling, and three.js.
  - `10_base.js`: helpers, the map, places, buildings and items.
  - `20_interior.js`: rooms, furniture, doors, collision and paths.
  - `30_inventory.js`: the grid inventory model and loot.
  - `40_sim.js`: the world state, people, groups and the hourly simulation.
  - `50_talk.js`: conversations, decided by rules. `55_ai.js` has Claude write the words.
  - `60_world.js` and `65_figs.js`: the 3D town, buildings, and the jointed figures.
  - `68_play.js`: moving, doors, the dead, fighting, the camera and light.
  - `70_ui.js` and `80_inv_ui.js`: the screen, panels, talking, and the inventory screen.
  - `90_boot.js`: character creation and start-up.
- `build.sh` concatenates them into `dist/index.html` and syntax-checks the script.
- `tests/` holds Playwright scripts used to play-test the build headlessly.

## Versions

`main` always holds the newest version. Each playable version is also saved as its own branch (`v2`, `v3`, ...), so any earlier version can be opened on GitHub, checked out and rebuilt, or restored. To play an older version, open `dist/index.html` from that branch.
