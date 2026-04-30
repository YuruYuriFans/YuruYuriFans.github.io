# Ongeki Web

Browser-based rhythm game inspired by Sega's オンゲキ arcade game.  
Playable on PC and mobile — no build step, no dependencies beyond Phaser 3 CDN.

## Play

Open `index.html` in any modern browser, or deploy to GitHub Pages.

## GitHub Pages Deployment

1. Create a new repository (or use an existing one)
2. Push all files into the repo root:
   ```
   index.html
   src/
     game.js
     scenes/
       MenuScene.js
       GameScene.js
       ResultScene.js
   ```
3. Go to **Settings → Pages → Source** → set to `main` branch, `/ (root)`
4. Visit `https://<your-username>.github.io/<repo-name>/`

> **Note:** GitHub Pages serves ES modules correctly over HTTPS.  
> Opening `index.html` directly as `file://` may fail due to CORS on ES module imports.  
> Use a local server (e.g. `npx serve .` or VS Code Live Server) for local testing.

---

## Controls

### PC
| Action | Key |
|--------|-----|
| Lane 0 (Red-Left)   | `S` |
| Lane 1 (Red-Right)  | `D` |
| Lane 2 (Green-Left) | `F` |
| Lane 3 (Green-Right)| `J` |
| Lane 4 (Blue-Left)  | `K` |
| Lane 5 (Blue-Right) | `L` |
| Shoot Left  | `Q` |
| Shoot Right | `E` |
| Lever       | Mouse drag (bottom bar) |
| Quit song   | `ESC` |

### Mobile
- Tap the 6 on-screen lane buttons
- Drag the lever bar left/right
- Tap **L** / **R** to shoot at the enemy

---

## Note Types

| Type | How to hit |
|------|-----------|
| **TAP** | Press the lane button at the right time |
| **HOLD** | Press and hold until the tail passes |
| **FLICK** | Swipe the lever fast in the indicated direction (◀/▶) |
| **BELL** | Move your characters over the bell (auto-collect) — restores +1% HP |
| **SIDE** | Move the lever away from the indicated wall before the note arrives |

---

## Scoring

| Grade | Points | Condition |
|-------|--------|-----------|
| CRITICAL BREAK | 1500 × combo bonus | Within ±50 ms |
| BREAK          | 1000 × combo bonus | Within ±100 ms |
| HIT            |  400 × combo bonus | Within ±150 ms |
| MISS           |   0, −5% HP        | Outside ±150 ms or not pressed |
| BELL           |  700 flat, +1% HP  | Auto-collect via lever |

Combo bonus: `+0.5%` per combo, up to `+50%` at 100 combo.

---

## Rank Thresholds (SSS+ to D)

Weighted accuracy = (CP × 1.0 + PF × 0.85 + GD × 0.60) / total notes

| Rank | Threshold |
|------|-----------|
| SSS+ | ≥ 99%, zero MISS |
| SSS  | ≥ 97% |
| SS   | ≥ 93% |
| S    | ≥ 88% |
| A    | ≥ 78% |
| B    | ≥ 65% |
| C    | ≥ 50% |
| D    | < 50% or game over |

---

## Tech Stack

- [Phaser 3.60](https://phaser.io) — via CDN, no npm/webpack
- ES Modules (`type="module"`) — native browser support
- Web Audio API — procedural metronome and hit sounds
- Pure `Graphics` rendering — no sprite assets required
