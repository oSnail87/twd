# TWD (working title)

An original zombie-outbreak survival game about people. You wake up in the small town of Limon on the first morning of the outbreak. About seventy townspeople have their own families, memories and opinions, and they make their own choices: they form camps, trade, feud, fall in love, split apart and raid each other whether or not you're there.

The whole game is one HTML page (three.js for the world view). It runs as a claude.ai Artifact, or by opening `dist/index.html` in a browser.

## Layout

- `src/` holds the parts of the page, assembled in the order listed in `src/ORDER`.
- `build.sh` concatenates them into `dist/index.html` and syntax-checks the script.
- `tests/` holds Playwright scripts used to play-test the build headlessly.

## Versions

Each playable version is tagged (`v2`, `v3`, ...), so any earlier version can be checked out and rebuilt.
