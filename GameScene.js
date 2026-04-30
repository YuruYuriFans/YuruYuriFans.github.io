// ─────────────────────────────────────────────────────────────────────────────
//  DEMO CHART GENERATOR
//  BPM 140, 64 beats, six note types: tap · hold · flick · bell · side_l · side_r
// ─────────────────────────────────────────────────────────────────────────────
function generateDemoChart() {
  const BPM = 140;
  const ms  = n => Math.round(n * 60000 / BPM);   // beat → ms
  const notes = [];
  const add = (time, type, lane, extra = {}) =>
    notes.push({ time, type, lane, judged: false, holding: false, holdDone: false, ...extra });

  // ── Section 1 (beats 0–7): simple single taps ──────────────────────────
  [0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5].forEach((b, i) => {
    add(ms(b), 'tap', i % 6);
  });

  // ── Section 2 (beats 8–15): alternating pairs ──────────────────────────
  for (let b = 8; b < 16; b++) {
    add(ms(b),      'tap', (b * 2) % 6);
    add(ms(b + 0.5),'tap', ((b * 2) + 3) % 6);
  }

  // ── Section 3 (beats 16–23): hold + tap combos ─────────────────────────
  for (let b = 16; b < 24; b += 2) {
    add(ms(b),        'hold', b % 6,       { duration: ms(1.5) });
    add(ms(b + 1),    'tap',  (b + 3) % 6);
    add(ms(b + 1.5),  'tap',  (b + 1) % 6);
  }

  // ── Section 4 (beats 24–31): flick + bell introduction ─────────────────
  for (let b = 24; b < 32; b += 2) {
    add(ms(b),        'flick', 0, { direction: 'left'  });
    add(ms(b + 0.5),  'bell',  2);
    add(ms(b + 0.5),  'bell',  4);
    add(ms(b + 1),    'flick', 5, { direction: 'right' });
    add(ms(b + 1.5),  'tap',   1);
    add(ms(b + 1.5),  'tap',   4);
  }

  // ── Section 5 (beats 32–39): side notes + mixed ────────────────────────
  for (let b = 32; b < 40; b++) {
    add(ms(b), 'tap', b % 6);
    if (b % 4 === 0)  { add(ms(b), 'side_l'); }
    if (b % 4 === 2)  { add(ms(b), 'side_r'); }
    if (b % 2 === 0)  { add(ms(b + 0.5), 'bell', (b + 4) % 6); }
    else              { add(ms(b + 0.5), 'tap',  (b + 2) % 6); }
  }

  // ── Section 6 (beats 40–47): dense mixed ───────────────────────────────
  for (let b = 40; b < 48; b++) {
    add(ms(b),        'tap', b % 6);
    add(ms(b + 0.33), 'tap', (b + 2) % 6);
    add(ms(b + 0.66), 'tap', (b + 4) % 6);
    if (b % 4 === 0)  add(ms(b), 'bell', 3);
  }

  // ── Section 7 (beats 48–63): finale ────────────────────────────────────
  for (let b = 48; b < 64; b++) {
    if (b % 4 === 0) {
      [0,1,2,3,4,5].forEach(l => add(ms(b), 'tap', l));
    } else if (b % 4 === 1) {
      add(ms(b),       'hold',  0, { duration: ms(0.8) });
      add(ms(b),       'hold',  5, { duration: ms(0.8) });
      add(ms(b + 0.5), 'flick', 2, { direction: 'left'  });
      add(ms(b + 0.5), 'flick', 3, { direction: 'right' });
      add(ms(b),       'side_l');
    } else if (b % 4 === 2) {
      add(ms(b), 'bell', 0); add(ms(b), 'bell', 2); add(ms(b), 'bell', 4);
      add(ms(b + 0.5), 'tap', 1); add(ms(b + 0.5), 'tap', 3); add(ms(b + 0.5), 'tap', 5);
      add(ms(b), 'side_r');
    } else {
      add(ms(b),        'tap', (b * 7 + 1) % 6);
      add(ms(b + 0.25), 'tap', (b * 7 + 3) % 6);
      add(ms(b + 0.5),  'tap', (b * 7 + 5) % 6);
    }
  }

  // ── Enemy attack schedule ───────────────────────────────────────────────
  const enemyAttacks = [];
  for (let b = 8; b < 64; b += 5) {
    enemyAttacks.push({ time: ms(b), side: Math.floor((b - 8) / 5) % 2 === 0 ? 'right' : 'left' });
  }

  return {
    title:        'Luminous Grace',
    artist:       '~ Demo ~',
    bpm:          BPM,
    duration:     ms(64) + 2500,
    notes:        notes.sort((a, b) => a.time - b.time),
    enemyAttacks,
    enemyHP:      100,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
//  GAME SCENE
// ─────────────────────────────────────────────────────────────────────────────
export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ── Phaser lifecycle ──────────────────────────────────────────────────────
  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;

    // Perspective constants
    this.VP  = { x: this.W / 2, y: this.H * 0.155 };   // vanishing point
    this.JY  = this.H * 0.655;                           // judgment line Y
    this.JL  = 28;                                        // judgment left X
    this.JR  = this.W - 28;                               // judgment right X
    this.JW  = this.JR - this.JL;                         // judgment width

    // Timing windows (ms)
    this.TW = { CRITICAL: 50, PERFECT: 100, GOOD: 150, MISS: 200 };

    // Game state
    this.score       = 0;
    this.techScore   = 0;
    this.damage      = 0;
    this.combo       = 0;
    this.maxCombo    = 0;
    this.playerHP    = 100;
    this.enemyHP     = 100;
    this.grades      = { criticalPerfect: 0, perfect: 0, good: 0, miss: 0, bell: 0 };
    this.gameOver    = false;
    this.gameStarted = false;
    this.songTime    = 0;
    this.noteSpeed   = 1800;   // ms note travels VP → judgment

    // Lever
    this.leverX     = 0.5;
    this.prevLevX   = 0.5;
    this.leverVel   = 0;       // units/sec
    this.isDragging = false;
    this.lastBeat   = -1;

    // Active game objects
    this.pendingNotes = [];
    this.activeNotes  = [];
    this.pendingAtks  = [];
    this.bullets      = [];    // enemy bullets
    this.pShots       = [];    // player shots
    this.lanePressed  = new Array(6).fill(false);
    this.holdActive   = new Array(6).fill(null);

    // Chart
    this.chart        = generateDemoChart();
    this.pendingNotes = this.chart.notes.map(n => ({ ...n }));
    this.pendingAtks  = [...this.chart.enemyAttacks];
    this.enemyHP      = this.chart.enemyHP;

    // Side-note state
    this.wallDamageL = false;
    this.wallDamageR = false;

    // Audio
    this.audioCtx = null;
    try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}

    // Graphics layers (render order: back → front)
    this.gBG    = this.add.graphics();                    // background
    this.gField = this.add.graphics();                    // lane lines, judgment
    this.gNotes = this.add.graphics();                    // notes
    this.gChars = this.add.graphics();                    // characters
    this.gFX    = this.add.graphics();                    // bullets & shots
    this.gCtrl  = this.add.graphics();                    // lever bar
    this.gHUD   = this.add.graphics();                    // HP rings
    this.gOver  = this.add.graphics().setDepth(50);       // game-over overlay (persistent)

    this.setupHUDText();
    this.setupInput();
    this.setupButtons();
    this.showCountdown();
  }

  update(time, delta) {
    if (!this.gameStarted) { this.renderStatic(); return; }
    if (this.gameOver)     { return; }

    const dt = delta / 1000;
    this.songTime = time - this.songStartTime;

    // Lever velocity
    this.leverVel  = (this.leverX - this.prevLevX) / dt;
    this.prevLevX  = this.leverX;

    // Spawn notes (look-ahead = noteSpeed + margin)
    while (this.pendingNotes.length > 0 &&
           this.pendingNotes[0].time - this.songTime <= this.noteSpeed + 120) {
      this.activeNotes.push(this.pendingNotes.shift());
    }

    // Spawn enemy attacks
    while (this.pendingAtks.length > 0 && this.pendingAtks[0].time <= this.songTime) {
      this.spawnBullet(this.pendingAtks.shift().side);
    }

    // Metronome beat
    const beatIdx = Math.floor(this.songTime / (60000 / this.chart.bpm));
    if (beatIdx !== this.lastBeat) {
      this.lastBeat = beatIdx;
      this.beep(beatIdx % 4 === 0 ? 'BEAT_A' : 'BEAT');
    }

    this.checkFlick();
    this.checkBell();
    this.checkSideNotes();
    this.updateBullets(dt);
    this.updateHolds();
    this.autoMiss();

    // Cull notes that have fully passed
    this.activeNotes = this.activeNotes.filter(n => {
      const p = this.getNoteProgress(n.time);
      if (n.judged && p > 1.08) return false;
      if (!n.judged && p > 1.12) return false;
      return true;
    });

    // Song end
    if (this.songTime >= this.chart.duration &&
        this.pendingNotes.length === 0 &&
        this.activeNotes.length === 0) {
      this.endGame(false);
      return;
    }

    this.renderAll();
    this.updateHUDText();
  }

  // ── HUD text objects ──────────────────────────────────────────────────────
  setupHUDText() {
    const W = this.W, H = this.H;
    const mono = (sz, col = '#ffffff') => ({
      fontSize: `${sz}px`, fill: col, fontFamily: 'monospace', fontStyle: 'bold',
    });

    // Score (top-left corner)
    this.add.text(10, 8, 'SCORE', { fontSize: '10px', fill: '#556677', fontFamily: 'monospace' });
    this.txtScore = this.add.text(10, 20, '00000000', mono(20)).setDepth(5);

    // Technical score
    this.add.text(10, 46, 'TECHNICAL SCORE', { fontSize: '9px', fill: '#445566', fontFamily: 'monospace' });
    this.txtTech = this.add.text(10, 56, '0000000', { fontSize: '14px', fill: '#8899aa', fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(5);

    // Grade breakdown (left column, below HP ring)
    this.txtGrades = this.add.text(8, H * 0.42,
      'CRITICAL BREAK  0\nBREAK           0\nHIT             0\nMISS            0\nBELL            0', {
      fontSize: '10px', fill: '#667788', fontFamily: 'monospace', lineSpacing: 3,
    }).setDepth(5);

    // Damage
    this.add.text(8, H * 0.62, 'DAMAGE', { fontSize: '9px', fill: '#774444', fontFamily: 'monospace' }).setDepth(5);
    this.txtDamage = this.add.text(8, H * 0.628, '0', { fontSize: '13px', fill: '#cc6666', fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(5);

    // Player HP % (inside left ring)
    this.txtPlayerHP = this.add.text(65, H * 0.305, '100%', mono(13, '#00ee77')).setOrigin(0.5).setDepth(5);

    // Enemy HP % and label (inside right ring)
    this.txtEnemyHP  = this.add.text(W - 65, H * 0.295, '100%', mono(13, '#ff88cc')).setOrigin(0.5).setDepth(5);
    this.txtEnemyLbl = this.add.text(W - 65, H * 0.275, '0回目', { fontSize: '10px', fill: '#886699', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(5);

    // Combo (above judgment line)
    this.txtCombo = this.add.text(W / 2, this.JY - 55, '', mono(17, '#ffee44')).setOrigin(0.5).setDepth(5);

    // Grade popup
    this.txtGradePop = this.add.text(W / 2, this.JY - 82, '', mono(19, '#ffffff'))
      .setOrigin(0.5).setAlpha(0).setDepth(10);

    // Wall warning text (left / right)
    this.txtWallL = this.add.text(this.JL + 4, this.JY - 10, '◀ WALL', { fontSize: '11px', fill: '#ff4444', fontFamily: 'monospace' }).setAlpha(0).setDepth(10);
    this.txtWallR = this.add.text(this.JR - 4, this.JY - 10, 'WALL ▶', { fontSize: '11px', fill: '#ff4444', fontFamily: 'monospace' }).setOrigin(1, 0).setAlpha(0).setDepth(10);

    // Song info (bottom)
    this.add.text(W / 2, H - 5, `${this.chart.title}  /  ${this.chart.artist}  ♩=${this.chart.bpm}`, {
      fontSize: '11px', fill: '#334455', fontFamily: 'monospace',
    }).setOrigin(0.5, 1);

    // Countdown
    this.txtCountdown = this.add.text(W / 2, H * 0.44, '', {
      fontSize: '88px', fill: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20);
  }

  // ── Input setup ───────────────────────────────────────────────────────────
  setupInput() {
    // Lanes: S D F = 0 1 2,  J K L = 3 4 5
    const keys = ['S','D','F','J','K','L'];
    this.kbLanes = keys.map(k => this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[k]));
    this.kbLanes.forEach((key, i) => {
      key.on('down', () => this.onLaneDown(i));
      key.on('up',   () => this.onLaneUp(i));
    });

    // Shoot: Q = left, E = right
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q).on('down', () => this.fireShot('left'));
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E).on('down', () => this.fireShot('right'));

    // ESC = exit to menu
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.endGame(false));

    // Pointer for lever
    this.input.on('pointerdown', p => this.onPtrDown(p));
    this.input.on('pointermove', p => this.onPtrMove(p));
    this.input.on('pointerup',   () => { this.isDragging = false; });
    this.input.on('pointercancel', () => { this.isDragging = false; });
  }

  // ── On-screen buttons (mobile) ────────────────────────────────────────────
  setupButtons() {
    const W = this.W, H = this.H;

    // Lever zone bounds
    this.levY  = H * 0.770;
    this.levH  = 52;
    this.levLX = 10;
    this.levRX = W - 10;
    this.levW  = this.levRX - this.levLX;

    // 6 lane buttons — left 3 + right 3 with center gap
    const btnY  = H * 0.847;
    const btnW  = 68, btnH = 58;
    const colBG = [0xaa2222, 0x229944, 0x2255bb, 0xaa2222, 0x229944, 0x2255bb];
    const labels = ['S','D','F','J','K','L'];
    const leftXs  = [44, 116, 188];
    const rightXs = [W - 188, W - 116, W - 44];
    const xs = [...leftXs, ...rightXs];

    xs.forEach((bx, i) => {
      const r = this.add.rectangle(bx, btnY, btnW, btnH, colBG[i], 0.88)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xffffff, 0.35)
        .setDepth(30);
      this.add.text(bx, btnY, labels[i], {
        fontSize: '17px', fill: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(31);
      r.on('pointerdown', (_p, _x, _y, evt) => { evt.stopPropagation(); this.onLaneDown(i); });
      r.on('pointerup',   () => this.onLaneUp(i));
      r.on('pointerout',  () => this.onLaneUp(i));
    });

    // L / R shoot buttons
    const shootY = H * 0.926;
    const makeShoot = (cx, label, side, color) => {
      const b = this.add.rectangle(cx, shootY, 140, 62, color, 0.90)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xddaaff, 0.85)
        .setDepth(30);
      this.add.text(cx, shootY, label, {
        fontSize: '30px', fill: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(31);
      b.on('pointerdown', (_p, _x, _y, evt) => { evt.stopPropagation(); this.fireShot(side); });
      b.on('pointerover', () => b.setFillColor(0x9933cc));
      b.on('pointerout',  () => b.setFillColor(color));
    };
    makeShoot(72,     'L', 'left',  0x6622aa);
    makeShoot(W - 72, 'R', 'right', 0x6622aa);
  }

  // ── Lever pointer events ──────────────────────────────────────────────────
  onPtrDown(p) {
    if (p.y >= this.levY - this.levH / 2 - 8 &&
        p.y <= this.levY + this.levH / 2 + 8) {
      this.isDragging = true;
      this.setLeverX(p.x);
    }
  }
  onPtrMove(p) { if (this.isDragging) this.setLeverX(p.x); }
  setLeverX(px) {
    this.leverX = Phaser.Math.Clamp((px - this.levLX) / this.levW, 0, 1);
  }

  // ── Lane input ────────────────────────────────────────────────────────────
  onLaneDown(lane) {
    if (!this.gameStarted || this.gameOver) return;
    if (this.lanePressed[lane]) return;
    this.lanePressed[lane] = true;
    this.judgeForLane(lane);
  }
  onLaneUp(lane) {
    this.lanePressed[lane] = false;
    const h = this.holdActive[lane];
    if (h) { h.holdReleased = true; this.holdActive[lane] = null; }
  }

  judgeForLane(lane) {
    const now = this.songTime;
    let best = null, bestDt = Infinity;
    for (const n of this.activeNotes) {
      if (n.judged || n.lane !== lane || n.type === 'bell' || n.type === 'flick' ||
          n.type === 'side_l' || n.type === 'side_r') continue;
      const dt = Math.abs(n.time - now);
      if (dt <= this.TW.MISS && dt < bestDt) { best = n; bestDt = dt; }
    }
    if (best) this.resolveNote(best, bestDt);
  }

  // ── Note resolution ───────────────────────────────────────────────────────
  resolveNote(note, dt) {
    note.judged = true;
    const g = dt <= this.TW.CRITICAL ? 'CRITICAL'
            : dt <= this.TW.PERFECT  ? 'PERFECT'
            : dt <= this.TW.GOOD     ? 'GOOD'
            :                          'MISS';
    this.applyGrade(g);
    this.beep(g);
    if (note.type === 'hold' && g !== 'MISS') {
      note.holding = true;
      note.judged  = false;   // keep in active until tail
      this.holdActive[note.lane] = note;
    }
  }

  applyGrade(g) {
    const pts  = { CRITICAL: 1500, PERFECT: 1000, GOOD: 400, MISS: 0 };
    const bonus = Math.min(this.combo, 100) * 0.005;
    const earned = Math.round(pts[g] * (1 + bonus));
    this.score     += earned;
    this.techScore += earned;

    if (g === 'MISS') {
      this.combo   = 0;
      this.damage += 50;
      this.playerHP = Math.max(0, this.playerHP - 5);
      this.grades.miss++;
      this.popGrade('MISS', '#ff4444');
      if (this.playerHP <= 0) this.triggerGameOver();
    } else {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      if      (g === 'CRITICAL') { this.grades.criticalPerfect++; this.popGrade('CRITICAL BREAK', '#ffee33'); }
      else if (g === 'PERFECT')  { this.grades.perfect++;         this.popGrade('BREAK',          '#33ffee'); }
      else                       {
        this.grades.good++;
        this.damage  += 10;
        this.playerHP = Math.max(0, this.playerHP - 1);
        this.popGrade('HIT', '#99ff88');
      }
    }
  }

  popGrade(text, color) {
    this.txtGradePop
      .setText(text).setColor(color)
      .setAlpha(1).setY(this.JY - 82);
    this.tweens.killTweensOf(this.txtGradePop);
    this.tweens.add({
      targets:  this.txtGradePop,
      alpha:    0,
      y:        this.JY - 118,
      duration: 480,
      ease:     'Power2',
    });
  }

  // ── Shoot (L / R buttons) ─────────────────────────────────────────────────
  fireShot(side) {
    if (!this.gameStarted || this.gameOver) return;
    const now   = this.songTime;
    const lanes = side === 'left' ? [0,1,2] : [3,4,5];
    let bestDt  = Infinity;
    for (const n of this.activeNotes) {
      if (n.judged || n.type === 'bell' || n.type === 'side_l' || n.type === 'side_r') continue;
      if (!lanes.includes(n.lane)) continue;
      const dt = Math.abs(n.time - now);
      if (dt <= this.TW.MISS && dt < bestDt) bestDt = dt;
    }
    const dmg = bestDt <= this.TW.CRITICAL ? 14
              : bestDt <= this.TW.PERFECT  ? 9
              : bestDt <= this.TW.GOOD     ? 5
              :                              2;
    this.enemyHP = Math.max(0, this.enemyHP - dmg);

    const sx = this.JL + (side === 'left' ? 0.22 : 0.78) * this.JW;
    this.pShots.push({ x: sx, y: this.JY - 8, life: 28, color: side === 'left' ? 0x00eeff : 0xff44cc });
    this.beep('SHOT');
  }

  // ── Flick detection ───────────────────────────────────────────────────────
  checkFlick() {
    const THRESH = 1.4;   // lever units per second
    if (Math.abs(this.leverVel) < THRESH) return;
    const dir = this.leverVel < 0 ? 'left' : 'right';
    const now = this.songTime;
    for (const n of this.activeNotes) {
      if (n.judged || n.type !== 'flick' || n.direction !== dir) continue;
      const dt = Math.abs(n.time - now);
      if (dt <= this.TW.MISS) { this.resolveNote(n, dt); return; }
    }
  }

  // ── Bell auto-collection ──────────────────────────────────────────────────
  checkBell() {
    const charX  = this.JL + this.leverX * this.JW;
    const radius = this.JW * 0.135;
    for (const n of this.activeNotes) {
      if (n.judged || n.type !== 'bell') continue;
      const p = this.getNoteProgress(n.time);
      if (p < 0.78 || p > 1.12) continue;
      if (Math.abs(this.getLaneCX(n.lane) - charX) < radius) {
        n.judged       = true;
        this.grades.bell++;
        this.playerHP  = Math.min(100, this.playerHP + 1);   // +1% HP
        this.combo++;
        this.maxCombo  = Math.max(this.maxCombo, this.combo);
        this.score    += 700;
        this.techScore += 700;
        this.popGrade('BELL ♪', '#ffaa22');
        this.beep('BELL');
      }
    }
  }

  // ── Side / wall notes ─────────────────────────────────────────────────────
  //  Player takes damage if they are pressed against the wall when a SIDE note hits.
  //  Being away from the wall (leverX > 0.3 for side_r, leverX < 0.7 for side_l) is safe.
  checkSideNotes() {
    const now = this.songTime;
    for (const n of this.activeNotes) {
      if (n.judged || (n.type !== 'side_l' && n.type !== 'side_r')) continue;
      const dt = n.time - now;
      if (Math.abs(dt) > this.TW.MISS) continue;
      n.judged = true;
      const safe = n.type === 'side_l'
        ? (this.leverX > 0.30)     // move away from left wall
        : (this.leverX < 0.70);    // move away from right wall
      if (safe) {
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.score   += 500;
        this.popGrade('WALL EVADE', '#cc88ff');
        this.beep('PERFECT');
      } else {
        this.combo    = 0;
        this.damage  += 30;
        this.playerHP = Math.max(0, this.playerHP - 7);
        this.popGrade('WALL HIT!', '#ff4444');
        this.beep('MISS');
        // Flash wall indicator
        const tgt = n.type === 'side_l' ? this.txtWallL : this.txtWallR;
        tgt.setAlpha(1);
        this.tweens.add({ targets: tgt, alpha: 0, duration: 600 });
        if (this.playerHP <= 0) this.triggerGameOver();
      }
    }
  }

  // ── Enemy bullets ─────────────────────────────────────────────────────────
  spawnBullet(side) {
    this.bullets.push({
      side,
      startX: side === 'left' ? this.JL - 40  : this.JR + 40,
      startY: this.VP.y + (this.JY - this.VP.y) * 0.28,
      endX:   side === 'left' ? this.JL + this.JW * 0.22 : this.JR - this.JW * 0.22,
      endY:   this.JY - 18,
      progress: 0, speed: 0.52, hit: false, x: 0, y: 0,
    });
  }

  updateBullets(dt) {
    const charX    = this.JL + this.leverX * this.JW;
    const hitR     = this.JW * 0.17;
    this.bullets   = this.bullets.filter(b => {
      b.progress  += b.speed * dt;
      b.x = Phaser.Math.Linear(b.startX, b.endX, Math.min(1, b.progress));
      b.y = Phaser.Math.Linear(b.startY, b.endY, Math.min(1, b.progress));
      if (b.progress >= 1 && !b.hit) {
        b.hit = true;
        if (Math.abs(b.endX - charX) < hitR) {
          this.playerHP = Math.max(0, this.playerHP - 8);
          this.damage  += 40;
          this.popGrade('BULLET HIT', '#ff2244');
          this.beep('MISS');
          if (this.playerHP <= 0) this.triggerGameOver();
        }
      }
      return b.progress < 1.35;
    });

    this.pShots = this.pShots.filter(s => {
      s.y -= 7; s.life--; return s.life > 0;
    });
  }

  // ── Hold note tracking ────────────────────────────────────────────────────
  updateHolds() {
    for (let lane = 0; lane < 6; lane++) {
      const h = this.holdActive[lane];
      if (!h || h.holdReleased) continue;
      if (this.songTime - h.time >= h.duration) {
        h.holding = false;
        h.judged  = true;
        this.holdActive[lane] = null;
        this.combo++;
        this.maxCombo  = Math.max(this.maxCombo, this.combo);
        this.score    += 350;
        this.popGrade('HOLD OK', '#aaffee');
        this.beep('PERFECT');
      }
    }
  }

  // ── Auto-miss notes past window ───────────────────────────────────────────
  autoMiss() {
    for (const n of this.activeNotes) {
      if (n.judged) continue;
      if (n.type !== 'bell' && n.type !== 'side_l' && n.type !== 'side_r' &&
          this.songTime > n.time + this.TW.MISS) {
        n.judged = true;
        this.applyGrade('MISS');
      }
    }
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  beep(type) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const freqs  = { CRITICAL:1400, PERFECT:900, GOOD:660, MISS:110, SHOT:500, BELL:1200, BEAT:300, BEAT_A:600 };
    const shapes = { MISS:'sawtooth', BEAT:'triangle', BEAT_A:'triangle' };
    const durs   = { MISS:0.22, BEAT:0.07, BEAT_A:0.09 };
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freqs[type] || 440;
    osc.type = shapes[type] || 'sine';
    const t   = ctx.currentTime;
    const dur = durs[type] || 0.09;
    const vol = (type === 'BEAT' || type === 'BEAT_A') ? 0.10 : 0.22;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  // ── Countdown ─────────────────────────────────────────────────────────────
  showCountdown() {
    let n = 3;
    const tick = () => {
      if (n > 0)       { this.txtCountdown.setText(String(n)); this.beep('BEAT'); }
      else if (n === 0){ this.txtCountdown.setText('GO!');     this.beep('BEAT_A'); }
      else             { this.txtCountdown.setAlpha(0); this.startGame(); return; }
      n--;
      this.time.delayedCall(1000, tick);
    };
    tick();
  }

  startGame() {
    this.gameStarted   = true;
    this.songStartTime = this.time.now;
  }

  // ── Game over / end ───────────────────────────────────────────────────────
  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.gOver.fillStyle(0xff0000, 0.42);
    this.gOver.fillRect(0, 0, this.W, this.H);
    this.add.text(this.W / 2, this.H / 2, 'GAME OVER', {
      fontSize: '54px', fill: '#ff2222', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(60);
    this.time.delayedCall(2200, () => this.endGame(true));
  }

  endGame(fail) {
    this.scene.start('ResultScene', {
      score: Math.round(this.score), techScore: Math.round(this.techScore),
      damage: this.damage, maxCombo: this.maxCombo,
      grades: { ...this.grades },
      playerHP: Math.round(this.playerHP), enemyHP: Math.round(this.enemyHP),
      fail, title: this.chart.title,
    });
  }

  // ── Perspective helpers ───────────────────────────────────────────────────
  getNoteProgress(noteTime) { return 1 - (noteTime - this.songTime) / this.noteSpeed; }
  getLaneCX(lane) { return this.JL + (lane + 0.5) * (this.JW / 6); }
  getLaneRange(lane) {
    const lw = this.JW / 6;
    return { l: this.JL + lane * lw, r: this.JL + (lane + 1) * lw };
  }
  // Project judgment-line X to screen X at perspective progress p
  px(xJ, p) { return this.VP.x + (xJ - this.VP.x) * p; }
  py(p)     { return this.VP.y + (this.JY - this.VP.y) * p; }

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDERING
  // ─────────────────────────────────────────────────────────────────────────
  renderStatic() {
    this.renderBackground();
    this.renderLanes();
    this.renderLever();
    this.renderHPRings();
    this.updateHUDText();
  }

  renderAll() {
    this.renderBackground();
    this.renderLanes();
    this.renderNotes();
    this.renderCharacters();
    this.renderFX();
    this.renderLever();
    this.renderHPRings();
  }

  renderBackground() {
    this.gBG.clear();
    this.gBG.fillStyle(0x09090f);
    this.gBG.fillRect(0, 0, this.W, this.H);

    // Dark playfield trapezoid
    this.gBG.fillStyle(0x0b0b1e, 1);
    this.gBG.fillPoints([
      { x: this.VP.x, y: this.VP.y },
      { x: this.JR,   y: this.JY },
      { x: this.JL,   y: this.JY },
    ], true);

    // Perspective scan-lines (depth cue)
    for (let y = this.VP.y; y <= this.JY; y += 14) {
      const t  = (y - this.VP.y) / (this.JY - this.VP.y);
      const xl = this.px(this.JL, t), xr = this.px(this.JR, t);
      this.gBG.lineStyle(1, 0x111133, 0.35 * t);
      this.gBG.beginPath();
      this.gBG.moveTo(xl, y); this.gBG.lineTo(xr, y);
      this.gBG.strokePath();
    }
  }

  renderLanes() {
    this.gField.clear();
    const LC = [0xdd3333, 0xdd3333, 0x33bb55, 0x33bb55, 0x3366ee, 0x3366ee];

    // Lane dividers
    for (let i = 0; i <= 6; i++) {
      const xJ = this.JL + (i / 6) * this.JW;
      const thick = (i === 0 || i === 6 || i === 2 || i === 4) ? 1.5 : 0.8;
      this.gField.lineStyle(thick, 0x2a3a55, 0.9);
      this.gField.beginPath();
      this.gField.moveTo(this.VP.x, this.VP.y);
      this.gField.lineTo(xJ, this.JY);
      this.gField.strokePath();
    }

    // Lane color glow (center strip)
    for (let i = 0; i < 6; i++) {
      const midJ = this.JL + (i + 0.5) * (this.JW / 6);
      this.gField.lineStyle(2, LC[i], 0.20);
      this.gField.beginPath();
      this.gField.moveTo(this.VP.x, this.VP.y);
      this.gField.lineTo(midJ, this.JY);
      this.gField.strokePath();
    }

    // Judgment line
    this.gField.lineStyle(4, 0xffee00, 1.0);
    this.gField.beginPath();
    this.gField.moveTo(this.JL, this.JY); this.gField.lineTo(this.JR, this.JY);
    this.gField.strokePath();

    // Glow above judgment
    [0.18, 0.10, 0.05, 0.02].forEach((a, i) => {
      this.gField.lineStyle(1, 0xffee00, a);
      this.gField.beginPath();
      this.gField.moveTo(this.JL, this.JY - (i + 1) * 4);
      this.gField.lineTo(this.JR, this.JY - (i + 1) * 4);
      this.gField.strokePath();
    });
  }

  renderNotes() {
    this.gNotes.clear();
    const LC = [0xff4444, 0xff5555, 0x44ee66, 0x55ff77, 0x4488ff, 0x55aaff];

    for (const n of this.activeNotes) {
      const p = this.getNoteProgress(n.time);
      if (p < 0.02 || p > 1.10) continue;
      const cp  = Math.min(p, 1.0);
      const lr  = this.getLaneRange(n.lane);
      const col = LC[n.lane] || 0xffffff;

      if (n.type === 'tap') {
        if (!n.judged) this.drawTapNote(lr, cp, col);

      } else if (n.type === 'flick') {
        if (!n.judged) {
          this.drawTapNote(lr, cp, 0xffffff, 0.038);
          // Arrow
          const cx  = this.px((lr.l + lr.r) / 2, cp);
          const cy  = this.py(cp) - 2;
          const dir = n.direction === 'left' ? -1 : 1;
          this.gNotes.fillStyle(col, 1);
          this.gNotes.fillTriangle(
            cx + dir * 16, cy,
            cx - dir * 8,  cy - 10,
            cx - dir * 8,  cy + 10
          );
        }

      } else if (n.type === 'hold') {
        const tailTime = n.time + n.duration;
        const tailP    = this.getNoteProgress(tailTime);
        const clampTP  = Math.max(0.02, Math.min(1.0, tailP));
        const clampHP  = Math.min(cp, 1.0);

        if (clampHP > 0.02) {
          // Body
          const x0l = this.px(lr.l + 3, clampHP), x0r = this.px(lr.r - 3, clampHP);
          const x1l = this.px(lr.l + 3, clampTP),  x1r = this.px(lr.r - 3, clampTP);
          const y0  = this.py(clampHP), y1 = this.py(clampTP);
          this.gNotes.fillStyle(col, n.holding ? 0.85 : 0.55);
          this.gNotes.fillPoints([
            {x:x0l,y:y0},{x:x0r,y:y0},{x:x1r,y:y1},{x:x1l,y:y1}
          ], true);
          // Tail bar
          this.gNotes.fillStyle(0xffffff, 0.88);
          this.gNotes.fillRect(x1l - 1, y1 - 3, (x1r - x1l) + 2, 6);
        }

      } else if (n.type === 'bell') {
        if (!n.judged) {
          const bx = this.px(this.getLaneCX(n.lane), cp);
          const by = this.py(cp);
          const r  = Math.max(5, 22 * cp);
          this.gNotes.fillStyle(0xffaa00, 0.92);
          this.gNotes.fillCircle(bx, by, r);
          this.gNotes.lineStyle(2, 0xffee66, 1);
          this.gNotes.strokeCircle(bx, by, r);
          if (r > 9) {
            this.gNotes.fillStyle(0xffffbb, 0.65);
            this.gNotes.fillCircle(bx, by, r * 0.38);
          }
        }

      } else if (n.type === 'side_l' || n.type === 'side_r') {
        if (!n.judged) this.drawSideNote(n.type, cp);
      }
    }
  }

  drawTapNote(lr, p, color, noteH = 0.042) {
    const p0 = p, p1 = Math.max(0.01, p - noteH);
    const x0l = this.px(lr.l + 2, p0), x0r = this.px(lr.r - 2, p0);
    const x1l = this.px(lr.l + 2, p1), x1r = this.px(lr.r - 2, p1);
    const y0  = this.py(p0),           y1   = this.py(p1);
    this.gNotes.fillStyle(color, 0.94);
    this.gNotes.fillPoints([{x:x0l,y:y0},{x:x0r,y:y0},{x:x1r,y:y1},{x:x1l,y:y1}], true);
    // Bright leading edge
    this.gNotes.lineStyle(2, 0xffffff, 0.7);
    this.gNotes.beginPath();
    this.gNotes.moveTo(x1l, y1); this.gNotes.lineTo(x1r, y1);
    this.gNotes.strokePath();
  }

  drawSideNote(type, p) {
    // Side notes: wall indicators that sweep from the side
    const fromLeft = type === 'side_l';
    const wallX    = fromLeft ? this.JL : this.JR;
    const insetX   = fromLeft ? this.JL + this.JW * 0.18 : this.JR - this.JW * 0.18;
    const pWall    = this.px(wallX, p),  pInset = this.px(insetX, p);
    const yy       = this.py(p);
    const h        = Math.max(4, 22 * p);
    this.gNotes.fillStyle(0xff66ff, 0.82);
    this.gNotes.fillRect(
      Math.min(pWall, pInset), yy - h / 2,
      Math.abs(pInset - pWall), h
    );
    // Arrow tip
    const tip = fromLeft ? pInset + 10 : pInset - 10;
    this.gNotes.fillTriangle(
      tip, yy,
      pInset, yy - h / 2,
      pInset, yy + h / 2
    );
  }

  renderCharacters() {
    this.gChars.clear();
    const charCX = this.JL + this.leverX * this.JW;
    const sp     = this.JW * 0.14;
    const cols   = [0xff4444, 0x44ee66, 0x4488ff];
    const darks  = [0x881111, 0x118833, 0x112266];

    [charCX - sp, charCX, charCX + sp].forEach((cx, i) => {
      const x = Phaser.Math.Clamp(cx, this.JL + 22, this.JR - 22);
      const y = this.JY + 34;
      // Body
      this.gChars.fillStyle(cols[i], 0.92);
      this.gChars.fillRect(x - 19, y - 28, 38, 46);
      // Head
      this.gChars.fillCircle(x, y - 34, 17);
      // Shadow strip
      this.gChars.fillStyle(darks[i], 0.45);
      this.gChars.fillRect(x + 5, y - 26, 12, 44);
      // Outline
      this.gChars.lineStyle(2, 0xffffff, 0.55);
      this.gChars.strokeRect(x - 19, y - 28, 38, 46);
      this.gChars.strokeCircle(x, y - 34, 17);
    });
  }

  renderFX() {
    this.gFX.clear();
    // Enemy bullets (pink orbs)
    for (const b of this.bullets) {
      if (!b.x && b.x !== 0) continue;
      this.gFX.fillStyle(0xff44aa, 0.9);
      this.gFX.fillCircle(b.x, b.y, 14);
      this.gFX.fillStyle(0xffaadd, 0.6);
      this.gFX.fillCircle(b.x, b.y, 7);
      this.gFX.lineStyle(2, 0xff88cc, 0.8);
      this.gFX.strokeCircle(b.x, b.y, 14);
    }
    // Player shots
    for (const s of this.pShots) {
      const a = s.life / 28;
      this.gFX.fillStyle(s.color, a);
      this.gFX.fillRect(s.x - 4, s.y - 14, 8, 28);
    }
  }

  renderLever() {
    this.gCtrl.clear();
    const ly = this.levY, lh = this.levH, lx = this.levLX, lw = this.levW;

    // Background
    this.gCtrl.fillStyle(0x0f0f22, 0.96);
    this.gCtrl.fillRoundedRect(lx, ly - lh / 2, lw, lh, 12);
    this.gCtrl.lineStyle(2, 0x2233aa, 0.8);
    this.gCtrl.strokeRoundedRect(lx, ly - lh / 2, lw, lh, 12);

    // Track
    this.gCtrl.lineStyle(1, 0x334466, 0.9);
    this.gCtrl.beginPath();
    this.gCtrl.moveTo(lx + 20, ly); this.gCtrl.lineTo(lx + lw - 20, ly);
    this.gCtrl.strokePath();

    // Center notch
    this.gCtrl.fillStyle(0x2a3a66, 1);
    this.gCtrl.fillRect(lx + lw / 2 - 2, ly - lh / 2 + 6, 4, lh - 12);

    // Handle
    const hx = lx + this.leverX * lw;
    this.gCtrl.fillStyle(0x5588ff, 1);
    this.gCtrl.fillRoundedRect(hx - 20, ly - lh / 2 + 5, 40, lh - 10, 7);
    this.gCtrl.lineStyle(2, 0x99bbff, 0.9);
    this.gCtrl.strokeRoundedRect(hx - 20, ly - lh / 2 + 5, 40, lh - 10, 7);
    // Handle grip lines
    [-6, 0, 6].forEach(dx => {
      this.gCtrl.lineStyle(1, 0xaaccff, 0.4);
      this.gCtrl.beginPath();
      this.gCtrl.moveTo(hx + dx, ly - lh / 2 + 9);
      this.gCtrl.lineTo(hx + dx, ly + lh / 2 - 9);
      this.gCtrl.strokePath();
    });
  }

  renderHPRings() {
    this.gHUD.clear();
    const H    = this.H, W = this.W;
    const ry   = H * 0.305;
    const rR   = 42;
    const span = Math.PI * 1.5;
    const s0   = -Math.PI * 0.75;

    // ── Player HP (left) ──────────────────────────────────────────────
    const plx = 65;
    const pFr = Phaser.Math.Clamp(this.playerHP / 100, 0, 1);
    const pHpColor = pFr > 0.5 ? 0x00ee66 : pFr > 0.25 ? 0xeeaa00 : 0xee2222;

    // BG arc
    this.gHUD.lineStyle(11, 0x0f2a1a, 1);
    this.gHUD.beginPath(); this.gHUD.arc(plx, ry, rR, s0, s0 + span, false); this.gHUD.strokePath();
    // HP arc
    if (pFr > 0) {
      this.gHUD.lineStyle(11, pHpColor, 1);
      this.gHUD.beginPath(); this.gHUD.arc(plx, ry, rR, s0, s0 + span * pFr, false); this.gHUD.strokePath();
    }
    // Hex frame
    this.hexFrame(plx, ry, rR + 14, 0x44cc88, 0x113322);

    // TEAM LIFE label
    this.gHUD.lineStyle(0, 0, 0);
    // (done via text objects)

    // ── Enemy HP (right) ─────────────────────────────────────────────
    const enx = W - 65;
    const eFr = Phaser.Math.Clamp(this.enemyHP / 100, 0, 1);

    this.gHUD.lineStyle(11, 0x2a0f18, 1);
    this.gHUD.beginPath(); this.gHUD.arc(enx, ry, rR, s0, s0 + span, false); this.gHUD.strokePath();
    if (eFr > 0) {
      this.gHUD.lineStyle(11, 0xee2277, 1);
      this.gHUD.beginPath(); this.gHUD.arc(enx, ry, rR, s0, s0 + span * eFr, false); this.gHUD.strokePath();
    }
    this.hexFrame(enx, ry, rR + 14, 0xcc44aa, 0x330011);
  }

  hexFrame(cx, cy, r, stroke, fill) {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 - 30) * Math.PI / 180;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
    this.gHUD.fillStyle(fill, 0.55);
    this.gHUD.fillPoints(pts, true);
    this.gHUD.lineStyle(3, stroke, 0.85);
    this.gHUD.strokePoints(pts, true);
  }

  updateHUDText() {
    this.txtScore.setText(String(Math.round(this.score)).padStart(8, '0'));
    this.txtTech.setText(String(Math.round(this.techScore)).padStart(7, '0'));
    this.txtDamage.setText(String(this.damage));
    this.txtCombo.setText(this.combo > 1 ? `${this.combo} COMBO` : '');
    this.txtPlayerHP.setText(`${Math.round(this.playerHP)}%`);
    this.txtEnemyHP.setText(`${Math.round(this.enemyHP)}%`);
    const g = this.grades;
    this.txtGrades.setText(
      `CRITICAL BREAK  ${String(g.criticalPerfect).padStart(4)}\n` +
      `BREAK           ${String(g.perfect).padStart(4)}\n` +
      `HIT             ${String(g.good).padStart(4)}\n` +
      `MISS            ${String(g.miss).padStart(4)}\n` +
      `BELL            ${String(g.bell).padStart(4)}`
    );
  }
}
