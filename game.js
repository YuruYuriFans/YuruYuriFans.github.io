import { MenuScene }   from './scenes/MenuScene.js';
import { GameScene }   from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 854,
  backgroundColor: '#0a0a14',
  parent: 'game-container',
  scene: [MenuScene, GameScene, ResultScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 6,   // multi-touch
  },
};

new Phaser.Game(config);
