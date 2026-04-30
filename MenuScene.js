export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const g = this.add.graphics();

    // Background gradient
    g.fillGradientStyle(0x08081a, 0x08081a, 0x12082a, 0x12082a, 1);
    g.fillRect(0, 0, W, H);

    // Decorative lane lines
    const laneColors = [0xe74c3c, 0x2ecc71, 0x3498db];
    laneColors.forEach((c, i) => {
      g.lineStyle(2, c, 0.22);
      g.beginPath();
      g.moveTo(W / 2, H * 0.05);
      g.lineTo(W * 0.05 + i * W * 0.45, H * 0.95);
      g.strokePath();
      g.lineStyle(1, c, 0.12);
      g.beginPath();
      g.moveTo(W / 2, H * 0.05);
      g.lineTo(W * 0.1 + i * W * 0.42, H * 0.95);
      g.strokePath();
    });

    // Title
    this.add.text(W / 2, H * 0.22, 'オンゲキ', {
      fontSize: '20px', fill: '#8888aa', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.30, 'ONGEKI', {
      fontSize: '62px', fill: '#00eeff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#005566', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.40, '── WEB ──', {
      fontSize: '22px', fill: '#cc88ff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Controls guide
    this.add.text(W / 2, H * 0.56,
      'KEYBOARD\n' +
      'S D F  |  J K L   →  Lane buttons\n' +
      'Q / E              →  Shoot L / R\n' +
      'Mouse drag (bottom) →  Lever\n\n' +
      'MOBILE\n' +
      'Tap on-screen buttons\n' +
      'Drag lever bar left / right', {
      fontSize: '13px', fill: '#999999', fontFamily: 'monospace',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5);

    // Play button
    const btn = this.add.rectangle(W / 2, H * 0.80, 220, 58, 0x1133aa)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x4477ff, 1);
    this.add.text(W / 2, H * 0.80, '▶  PLAY', {
      fontSize: '26px', fill: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillColor(0x2255cc));
    btn.on('pointerout',  () => btn.setFillColor(0x1133aa));
    btn.on('pointerdown', () => this.scene.start('GameScene'));

    this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('GameScene'));

    // Version
    this.add.text(W - 8, H - 6, 'v1.0 demo', {
      fontSize: '10px', fill: '#333344', fontFamily: 'monospace',
    }).setOrigin(1, 1);
  }
}
