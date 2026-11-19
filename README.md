# TWD (working title)

An original zombie-outbreak survival game about people. You wake up in the small town of Limon, either in a hospital bed a week into the outbreak or at home on its first morning. About seventy townspeople have their own families, memories and opinions, and they make their own choices: they form camps, trade, feud, fall in love, split apart and raid each other whether or not you're there.

The whole game is one HTML page (three.js for the world view). It runs as a claude.ai Artifact, or by opening `dist/index.html` in a browser.

## What's in v5

- Fights go in turns. When one of the dead reaches you, or you go after someone, time holds still and a fight screen opens. Each round you pick a move (attack, defend, shove, run, or with people, talk them down), both sides roll a d20 and add their edge (skill, weapon, armor, being hurt or worn out), and the higher total wins. Ties go to whoever is defending. Every roll is shown in the fight log, and every button shows your odds before you choose.
- The dead can only bite you after they get hold of you, and the screen tells you when one has. You get a turn to break free, kill it or brace before it tries.
- You can attack survivors (adults only) from the talk window. People guard, swing, try to run or give up when they're beaten, and then you decide: let them go, take their things or finish it. Bare hands knock people down but don't kill them. Anyone who sees it remembers, word gets around, and their family and friends may step in.
- Healing is simple now: wash a wound, wrap it, eat and drink, and take antibiotics if it turns. One button tends everything you can.
- Everyone has an American name that fits when they were born, and talks their age: kids sound like kids, teens like teens, and only older folks call you "sweetheart". Conversations are looser and more personal, with room for small talk when Claude is writing the words.

## What's in v4

- A new start: you were in a coma at Limon Hospital when it began. The town lives its first week without you (the same simulation, run fast while a short "while you were asleep" sequence plays), and you wake on day 8 behind a door your nurse locked from the hall, with her note, your things in a bag and one of the dead in the waiting room. Whoever you lived with leaves a note at home saying where they went, if they could. The people screen only shows what you've seen since you woke. The old day-one start is still there.
- A body health screen (H): every cut, bite, bruise and break sits on a part of a drawn body, with what it's doing and what it needs. Wounds bleed, get dirty, get infected and heal over days. Broken legs slow you and stop you running, broken arms weaken your swing, pain and fever wear you down.
- Hands-on treatment on that screen: wipe a wound clean, stitch it mark by mark, wrap a bandage by holding and letting go in the green, drag a splint into place and strap it. How well you do it decides how well it works. Dressings soak through and need changing; bloody bandages can be boiled clean.
- Townspeople run on needs (food, water, rest, fear, company) and make plans to meet them: stock up, scavenge, fetch water, hide, look for family, join or found groups. The dead attack them too.
- More pull when you talk to people once things go bad, and relationships that can turn into something more (always fade-to-black).

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
  - `35_body.js`: wounds, bleeding, infection, healing and treatment.
  - `40_sim.js`: the world state, people, groups and the hourly simulation.
  - `45_mind.js`: what each person needs and plans to do about it. `52_bond.js`: following, invitations and relationships.
  - `48_coma.js`: the coma start: the week you sleep through, waking up, and the notes left for you.
  - `50_talk.js`: conversations, decided by rules. `55_ai.js` has Claude write the words.
  - `60_world.js` and `65_figs.js`: the 3D town, buildings, and the jointed figures.
  - `68_play.js`: moving, doors, the dead, the camera and light. `69_fight.js`: turn-based fights and the fight screen.
  - `70_ui.js` and `80_inv_ui.js`: the screen, panels, talking, and the inventory screen. `75_health.js`: the body screen and hands-on treatment.
  - `90_boot.js`: character creation and start-up.
- `build.sh` concatenates them into `dist/index.html` and syntax-checks the script.
- `tests/` holds the checks: `sim.js`, `body.js`, `coma.js`, `people.js`, `talk.js` and `fight.js` run the game with no screen; `play.js`, `health.js`, `coma_ui.js` and `fight_ui.js` play the built page in headless Chromium and save screenshots.

## Versions

`main` always holds the newest version. Each playable version is also saved as its own branch (`v2`, `v3`, ...), so any earlier version can be opened on GitHub, checked out and rebuilt, or restored. To play an older version, open `dist/index.html` from that branch.
