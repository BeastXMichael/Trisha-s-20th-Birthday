import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { LEVELS } from '../constants/levels';

export class ReadyScene extends Phaser.Scene {
  private levelIndex: number = 0;
  private mapMusic?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'ReadyScene' });
  }

  init(data: { levelIndex: number }): void {
    this.levelIndex = data.levelIndex;
  }

  create(): void {
    const level = LEVELS[this.levelIndex];

    // Continue playing map music
    this.mapMusic = this.sound.add('mapMusic', { loop: true, volume: 0.6 });
    this.mapMusic.play();

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.skyBlue);

    // Decorative panel
    const panelWidth = 600;
    const panelHeight = 450;
    const panel = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      panelWidth,
      panelHeight,
      COLORS.white,
      0.95
    );
    panel.setStrokeStyle(4, COLORS.darkBlue);

    // Level name
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, level.name, {
      fontSize: '42px',
      color: '#4A90A4',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Token emoji (pre-game)
    const tokenEmoji = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, level.tokenEmoji, {
      fontSize: '64px',
    });
    tokenEmoji.setOrigin(0.5);

    // Description
    const desc = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, level.description, {
      fontSize: '22px',
      color: '#FF69B4',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic',
    });
    desc.setOrigin(0.5);

    // Objective
    const objective = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, `Objective: ${level.objective}`, {
      fontSize: '20px',
      color: '#555555',
      fontFamily: 'Arial, sans-serif',
    });
    objective.setOrigin(0.5);

    // Controls hint
    const controls = this.getControlsText();
    const controlsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, controls, {
      fontSize: '18px',
      color: '#777777',
      fontFamily: 'Arial, sans-serif',
    });
    controlsText.setOrigin(0.5);

    // Play button
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 170, 'Play!', COLORS.mint, () => {
      // Stop map music
      if (this.mapMusic) {
        this.mapMusic.stop();
      }

      // Play game start sound effect and start minigame immediately
      const gameStartSound = this.sound.add('gameStartSound', { volume: 0.7 });
      gameStartSound.play();
      this.scene.start(level.sceneKey, { levelIndex: this.levelIndex });
    });

    // Back button (positioned further left to avoid overlap)
    this.createButton(GAME_WIDTH / 2 - 220, GAME_HEIGHT / 2 + 170, 'Back', COLORS.lavender, () => {
      // Music will continue on MapScene
      this.scene.start('MapScene');
    }, true);
  }

  private getControlsText(): string {
    switch (this.levelIndex) {
      case 0:
        return 'Controls: Arrow Keys or A/D to dodge';
      case 1:
        return 'Controls: Click on Mexican foods';
      case 2:
        return 'Controls: Spacebar or Click when in the sweet spot';
      case 3:
        return 'Controls: Arrow Keys to steer';
      case 4:
        return 'Controls: Click to snap the photo';
      case 5:
        return 'Controls: Click to choose your answer';
      default:
        return '';
    }
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    color: number,
    callback: () => void,
    small: boolean = false
  ): void {
    const width = small ? 120 : 180;
    const height = small ? 45 : 55;
    const fontSize = small ? '20px' : '26px';

    const bg = this.add.rectangle(x, y, width, height, color);
    bg.setStrokeStyle(3, COLORS.darkBlue);
    bg.setInteractive({ useHandCursor: true });

    const buttonText = this.add.text(x, y, text, {
      fontSize,
      color: '#333333',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setAlpha(0.8);
      this.tweens.add({
        targets: [bg, buttonText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      bg.setAlpha(1);
      this.tweens.add({
        targets: [bg, buttonText],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    bg.on('pointerdown', callback);
  }
}
