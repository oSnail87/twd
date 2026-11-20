# Holdfast

A zombie-outbreak camp game about people. It starts on the first morning, stuck in a pileup on Route 9 outside the small town of Millbrook with a few strangers. You pick somewhere to hold, take people in or turn them away, and run the place as it grows from a camp into a town.

It's a separate game from TWD (the rest of this repository). The whole game is one HTML page (three.js for the isometric view). It runs as a claude.ai Artifact, or by opening `dist/index.html` in a browser. Saves stay in that browser; saves from TWD don't carry over.

## How it plays

- **Click or type.** Click the ground to walk, click people for a menu, click cars and buildings to search them. Or type anything in the box: "I say hi", "put Ruth on the farm", "Marcus, come with me", "build a tent", "I teach the kids to whittle". When the page runs on claude.ai, Claude works out what free text means and voices what people say, using the player's Claude usage. The built-in rules take over when Claude isn't available.
- **People decide for themselves.** Everyone has a nature (brave or timid, loyal or independent, kind or selfish...), a motive (their family, staying alive, being useful, revenge, faith, freedom), family, skills and memories. They spend free time how they like. When you ask something of them they weigh it and you see why: asked to go to war, a parent weighs making the world safer for their kid against staying home to keep them safe and near.
- **Delegation.** Give people jobs (farming, wood, water, building, guarding, scavenging, cooking, medic) and that work runs itself. Put someone in charge of a part of camp and its small problems (blight, a fever, a herd passing, a kitchen fire) go to them first. You only get pulled in when they can't handle it, or when nobody's in charge.
- **Scale.** A camp of three is quiet. A camp of thirty brings in far more, but problems and arguments come thick and fast, people you don't talk to drift, and you need beds, food and people running things.
- **People die.** From bites, fevers, starvation, raids, runs that go wrong, and medicine that runs out. You don't: if you go down, someone gets you home.
- **A world map of places.** Your camp is one walkable isometric scene. Every other place (the farm, the mill, the church, the scout camp, the motel, the stores in town, the police station, the school) loads as its own scene. Travel takes hours and whoever's following you comes along. Search, carry what you can, or burn it down.
- **Building by hand.** Place a structure where you want it, turn it, pick its colors and name it. Then build it yourself in a quick hands-on build (drive the stakes, raise the pole and let go in the green, drag the cover over), or leave it for whoever's on building.
- **Guns, for the dead.** A pistol sits in a state trooper's cruiser at the pileup. There are more in the police armory, the farm's gun cabinet and the odd glovebox. Once you find a gun you keep it on you. Click one of the dead (or type "shoot the walker") to fire. A shotgun can drop a few at once, and a rifle reaches far. You carry a limited number of rounds and top up from camp ammo. Every shot is loud and brings more of the dead. Spare guns go to your guards and runners, who use camp ammo. You can't turn a gun on the living: a fight with the Pruitts is a war you rally people for.
- **Crafting in your own words.** Type what you do with what the camp has. Claude judges whether it would really work: rope knotted into a fishing net works; metal and gunpowder don't make a gun. A list of sensible recipes covers it without Claude.
- **One shared store.** Everything the camp owns sits in a block grid. Anyone takes what they need, but they leave someone's insulin or EpiPen alone. Selfish people sometimes don't, and the whole camp feels it.
- **Another group.** A few days in, the Pruitt crew digs in somewhere nearby. They'll want a cut. You can pay, refuse, talk, burn them out at night, or ask your people who'll fight.

## Layout

- `src/` holds the parts of the page, assembled in order by `build.sh` into `dist/index.html`:
  - `00_head.html`: title, fonts, styling and three.js.
  - `10_data.js`: names, natures and motives, places, what each place holds, buildings, jobs, items and recipes.
  - `20_sim.js`: the world state, people, walking and paths, the dead, the hourly camp, newcomers, runs, the Pruitts and disasters.
  - `30_inv.js`: the shared block-grid store, people helping themselves, medicine people need, and crafting.
  - `35_mind.js`: how people weigh what you ask, and small talk by the rules.
  - `40_ai.js`: Claude voices, reading free text, and judging crafting.
  - `45_act.js`: everything you do, and reading what you type.
  - `50_world.js`: the isometric scenes, buildings and figures.
  - `60_ui.js`: the screen, menus, panels, disaster cards, the map, looting and placing buildings. `70_build.js`: the hands-on builds.
  - `90_boot.js`: the title screen and start-up.
- `tests/sim.js` runs two weeks of camp with no screen. `tests/play.js` plays the built page in headless Chromium and saves screenshots. `tests/ai.js` checks the Claude path with a stand-in. `tests/guns.js` finds the cruiser's pistol, shoots the dead by clicking and typing, checks that the living can't be shot, and hands guns between you and the guards. The browser tests need `npm i three@0.128.0` in this folder.
