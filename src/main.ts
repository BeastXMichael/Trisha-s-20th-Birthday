import Phaser from 'phaser';
import { gameConfig } from './config';

// Initialize the game
const game = new Phaser.Game(gameConfig);

// Add global fullscreen toggle with F key
window.addEventListener('keydown', (event) => {
  if (event.key === 'f' || event.key === 'F') {
    if (game.scale.isFullscreen) {
      game.scale.stopFullscreen();
    } else {
      game.scale.startFullscreen();
    }
  }
});
