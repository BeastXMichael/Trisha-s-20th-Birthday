import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const barWidth = 400;
    const barHeight = 30;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = GAME_HEIGHT / 2;

    // Background bar
    const bgBar = this.add.rectangle(barX, barY, barWidth, barHeight, COLORS.white);
    bgBar.setOrigin(0, 0.5);
    bgBar.setStrokeStyle(3, COLORS.darkBlue);

    // Progress bar
    const progressBar = this.add.rectangle(barX + 5, barY, 0, barHeight - 10, COLORS.pink);
    progressBar.setOrigin(0, 0.5);

    // Loading text
    const loadingText = this.add.text(GAME_WIDTH / 2, barY - 50, 'Loading...', {
      fontSize: '32px',
      color: '#333333',
      fontFamily: 'Arial, sans-serif',
    });
    loadingText.setOrigin(0.5);

    // Title text
    const titleText = this.add.text(GAME_WIDTH / 2, barY - 120, 'Cinnamo-Go!', {
      fontSize: '64px',
      color: '#4A90A4',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);

    // Load intro video
    this.load.video('introVideo', 'assets/video/intro.mp4');
    // Preload Judy sprite so it's available to all scenes (Vite-friendly URL)
    this.load.image('judy', new URL('../Assets/5c52bb54bb7e2a029589d29a.png', import.meta.url).href);

    // Update progress bar on load
    this.load.on('progress', (value: number) => {
      progressBar.width = (barWidth - 10) * value;
    });

    // Loading complete
    this.load.on('complete', () => {
      loadingText.setText('Ready!');
    });
  }

  create(): void {
    // Short delay then go to home screen
    this.time.delayedCall(500, () => {
      this.scene.start('HomeScene');
    });
  }
}
