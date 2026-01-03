import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class PreHomeScene extends Phaser.Scene {
  private buttonText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PreHomeScene' });
  }

  create(): void {
    // Black background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000);

    // Ensure no audio starts here
    this.sound.stopAll();

    this.buttonText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Game On!', {
      fontSize: '28px',
      color: '#FFFFFF',
      fontFamily: '"Press Start 2P", "Courier New", monospace',
    });
    this.buttonText.setOrigin(0.5);
    this.buttonText.setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: this.buttonText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.buttonText.on('pointerdown', () => {
      this.scene.start('HomeScene');
    });
  }
}
