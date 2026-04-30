export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  init(data) { this.d = data; }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const d = this.d;
    const g = this.add.graphics();

    // Background
    g.fillGradientStyle(0x080814, 0x080814, 0x100820, 0x100820, 1);
    g.fillRect(0, 0, W, H);

    // Header bar
    const barH = 80;
    const barColor = d.fail ? 0x330000 : 0x001133;
    g.fillStyle(barColor, 1);
    g.fillRect(0, 0, W, barH);
    g.lineStyle(2, d.fail ? 0xff2222 : 0x2255ff, 0.9);
    g.beginPath(); g.moveTo(0, barH); g.lineTo(W, barH); g.strokePath();

    const titleStr  = d.fail ? 'GAME OVER' : 'RESULT';
    const titleCol  = d.fail ? '#ff3333'   : '#ffee33';
    this.add.text(W / 2, barH / 2, titleStr, {
      fontSize: '38px', fill: titleCol, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Song title
    this.add.text(W / 2, 96, d.title || '', {
      fontSize: '15px', fill: '#778899', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Score
    this.add.text(W / 2, 126, 'SCORE', { fontSize: '11px', fill: '#445566', fontFamily: 'monospace' }).setOrigin(0.5);
    this.add.text(W / 2, 143, String(d.score).padStart(8, '0'), {
      fontSize: '36px', fill: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Technical score
    this.add.text(W / 2, 188, 'TECHNICAL SCORE', { fontSize: '10px', fill: '#334455', fontFamily: 'monospace' }).setOrigin(0.5);
    this.add.text(W / 2, 202, String(d.techScore || d.score).padStart(7, '0'), {
      fontSize: '18px', fill: '#7799aa', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Divider
    g.lineStyle(1, 0x223344, 0.8);
    g.beginPath(); g.moveTo(40, 226); g.lineTo(W - 40, 226); g.strokePath();

    // Grade breakdown
    const rows = [
      ['CRITICAL BREAK', d.grades.criticalPerfect, '#ffee33'],
      ['BREAK',          d.grades.perfect,          '#33ffee'],
      ['HIT',            d.grades.good,              '#88ff88'],
      ['MISS',           d.grades.miss,              '#ff5544'],
      ['BELL',           d.grades.bell,              '#ffaa22'],
    ];
    rows.forEach(([label, count, col], i) => {
      const y = 245 + i * 52;
      this.add.text(50, y, label, { fontSize: '15px', fill: col, fontFamily: 'monospace' });
      this.add.text(W - 50, y, String(count).padStart(4), {
        fontSize: '22px', fill: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(1, 0);
      g.lineStyle(1, 0x1a2a3a, 0.7);
      g.beginPath(); g.moveTo(40, y + 38); g.lineTo(W - 40, y + 38); g.strokePath();
    });

    // Max combo + damage
    const statsY = 515;
    this.add.text(60, statsY, `MAX COMBO\n${d.maxCombo}`, {
      fontSize: '14px', fill: '#aaaaff', fontFamily: 'monospace', align: 'center', lineSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(W / 2, statsY, `DAMAGE\n${d.damage || 0}`, {
      fontSize: '14px', fill: '#ff8888', fontFamily: 'monospace', align: 'center', lineSpacing: 2,
    }).setOrigin(0.5);

    // HP summary
    this.add.text(W - 60, statsY,
      `LIFE  ${d.playerHP}%\nENEMY ${d.enemyHP}%`, {
      fontSize: '12px', fill: '#88aa88', fontFamily: 'monospace', align: 'right', lineSpacing: 2,
    }).setOrigin(1, 0);

    // Rank
    const rank = this.calcRank(d.grades, d.fail);
    const rkCol = this.rankColor(rank);
    g.lineStyle(3, parseInt(rkCol.replace('#',''), 16), 0.4);
    g.strokeRect(W / 2 - 55, 560, 110, 85);
    this.add.text(W / 2, 600, rank, {
      fontSize: '60px', fill: rkCol, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Buttons
    this.makeBtn(W / 2 - 95, 720, 165, 55, 0x0f3311, 0x88ff88, 'RETRY',  () => this.scene.start('GameScene'));
    this.makeBtn(W / 2 + 95, 720, 165, 55, 0x0f1133, 0x8888ff, 'MENU',   () => this.scene.start('MenuScene'));

    this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('GameScene'));

    // Animate score counting up
    let displayed = 0;
    const target  = d.score;
    const timer   = this.time.addEvent({
      delay: 16, repeat: 60,
      callback: () => {
        displayed = Math.min(target, displayed + Math.ceil(target / 55));
        // already set as static text, so no live update needed here
      },
    });
  }

  makeBtn(cx, cy, bw, bh, bgCol, txtCol, label, onClick) {
    const b = this.add.rectangle(cx, cy, bw, bh, bgCol)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, parseInt(txtCol.replace('#',''), 16), 0.85);
    this.add.text(cx, cy, label, {
      fontSize: '22px', fill: txtCol, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    b.on('pointerover', () => b.setAlpha(0.75));
    b.on('pointerout',  () => b.setAlpha(1));
    b.on('pointerdown', onClick);
  }

  calcRank(grades, fail) {
    if (fail) return 'D';
    const total = grades.criticalPerfect + grades.perfect + grades.good + grades.miss + grades.bell;
    if (total === 0) return 'D';
    const wt = (grades.criticalPerfect * 1.0 + grades.perfect * 0.85 + grades.good * 0.60)
             / (total);
    if (wt >= 0.99 && grades.miss === 0) return 'SSS+';
    if (wt >= 0.97) return 'SSS';
    if (wt >= 0.93) return 'SS';
    if (wt >= 0.88) return 'S';
    if (wt >= 0.78) return 'A';
    if (wt >= 0.65) return 'B';
    if (wt >= 0.50) return 'C';
    return 'D';
  }

  rankColor(rank) {
    return ({ 'SSS+':'#ffff00', SSS:'#ffdd00', SS:'#ffaa00', S:'#ff8800',
               A:'#88ff22', B:'#22ffaa', C:'#22ddff', D:'#ff4444' })[rank] || '#ffffff';
  }
}
