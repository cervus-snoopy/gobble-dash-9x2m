[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![Rank](https://make.fun/badge/turkey-run-game-01/cervus-snoopy/gobble-dash-9x2m/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![Reward](https://make.fun/badge/turkey-run-game-01/cervus-snoopy/gobble-dash-9x2m/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

# Gobble Dash — Escape the Thanksgiving Table

Entry for the [turkey-run-game-01](https://make.fun/bounty/turkey-run-game-01) bounty on make.fun: a turkey escape game that runs in a desktop browser from static files, no network, no build step.

One turkey. One farmer. Zero stuffing. Run the farmyard, sneak the barn, dodge the kitchen — and reach the forest gate before the farmer grabs you.

## How to play

- **Space / Up / click** — jump and flap (twice in the air: a turkey flies badly, but it flies)
- **Down** — duck, and hide in a haystack when the farmer closes in
- **Shift** — sprint
- **P** — pause, **M** — mute

Collect corn for points and to shake the farmer off. Trip over a fence, a puddle or a falling carving knife and the farmer gains on you; three hits and you are dinner. Escape 1,800 m through three stages — Farmyard, Barn, Kitchen — to win.

## The game

Plain ES modules, no engine, no assets: every sprite is drawn in code on a 2D canvas and every sound is synthesized with WebAudio.

- `game/index.html` — the page
- `game/src/main.js` — loop and state machine (title, playing, paused, caught, escaped)
- `game/src/config.js` — tuning, stages, palette
- `game/src/player.js` — the turkey
- `game/src/farmer.js` — the chaser's AI
- `game/src/world.js` — spawning, collisions, score, stages
- `game/src/render.js` — all drawing: backdrops, characters, HUD, screens
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized sound effects
- `game/src/random.js` — seeded random numbers

`main.ts` hands the game in: it copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the kit's vendored library.

## License

MIT — see [LICENSE](LICENSE).
