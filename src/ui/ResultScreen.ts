import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { LEVELS } from '../constants/levels';
import { SaveManager } from '../systems/SaveManager';
import { DialogueSystem } from '../ui/DialogueSystem';
import { DIALOGUES } from '../constants/dialogues';

export class ResultScreen {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private levelIndex: number;
  private isWin: boolean;

  constructor(
    scene: Phaser.Scene,
    levelIndex: number,
    isWin: boolean,
    onRetry: () => void,
    onNext: () => void
  ) {
    this.scene = scene;
    this.levelIndex = levelIndex;
    this.isWin = isWin;

    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.container.setDepth(200);
    this.container.setAlpha(0);

    this.create(onRetry, onNext);

    // Fade in
    scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 300,
    });
  }

  private create(onRetry: () => void, onNext: () => void): void {
    const level = LEVELS[this.levelIndex];

    // Dark overlay
    const overlay = this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
    this.container.add(overlay);

    // Panel
    const panelWidth = 450;
    const panelHeight = 350;
    const panel = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, COLORS.white, 0.95);
    panel.setStrokeStyle(4, this.isWin ? COLORS.mint : COLORS.pink);
    this.container.add(panel);

    if (this.isWin) {
      this.createWinContent(level, onNext);
    } else {
      this.createLoseContent(onRetry);
    }
  }

  private createWinContent(level: typeof LEVELS[0], onNext: () => void): void {
    // Save progress
    const saveManager = SaveManager.getInstance();
    saveManager.completeLevel(this.levelIndex, level.id);

    // Title
    const title = this.scene.add.text(0, -120, '🎉 Amazing! 🎉', {
      fontSize: '42px',
      color: '#4A90A4',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Token earned
    const tokenText = this.scene.add.text(0, -50, `You earned: ${level.tokenEmoji} ${level.tokenName}`, {
      fontSize: '28px',
      color: '#555555',
      fontFamily: 'Arial, sans-serif',
    });
    tokenText.setOrigin(0.5);
    this.container.add(tokenText);

    // Token animation
    const token = this.scene.add.text(0, 20, level.tokenEmoji, {
      fontSize: '64px',
    });
    token.setOrigin(0.5);
    this.container.add(token);

    // Bounce animation
    this.scene.tweens.add({
      targets: token,
      y: token.y - 20,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Sparkles
    this.createSparkles();

    // Start a short Judy dialogue automatically for this win
    const dsAuto = new DialogueSystem(this.scene as Phaser.Scene);
    const autoKey = `afterMinigame${this.levelIndex + 1}`;
    // @ts-ignore
    const autoLines = (DIALOGUES as any)[autoKey] || [];
    dsAuto.startDialogue(autoLines, 'Judy').then(() => dsAuto.destroy());

    // Check if this was the last level
    const isLastLevel = this.levelIndex === 5;

    // Next/Finish button
    const buttonText = isLastLevel ? 'See Your Surprise!' : 'Continue';
    const button = this.createButton(0, 110, buttonText, COLORS.mint, () => {
      onNext();
    });
    this.container.add(button);
  }

  private createLoseContent(onRetry: () => void): void {
    // Record loss
    SaveManager.getInstance().recordLoss(this.levelIndex);

    // Title
    const title = this.scene.add.text(0, -100, 'Almost there!', {
      fontSize: '38px',
      color: '#FF69B4',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Encouragement
    const message = this.scene.add.text(0, -40, "Don't give up!\nYou've got this! 💪", {
      fontSize: '24px',
      color: '#555555',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
    });
    message.setOrigin(0.5);
    this.container.add(message);

    // Cute sad face
    const face = this.scene.add.text(0, 30, '🥺', {
      fontSize: '48px',
    });
    face.setOrigin(0.5);
    this.container.add(face);

    // Retry button
    const retryButton = this.createButton(0, 100, 'Try Again!', COLORS.pink, onRetry);
    this.container.add(retryButton);

    // Back to map button (smaller)
    const backButton = this.createButton(0, 150, 'Back to Map', COLORS.lavender, () => {
      this.scene.scene.start('MapScene');
    }, true);
    this.container.add(backButton);
  }

  private createSparkles(): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;
      const sparkle = this.scene.add.text(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance - 50,
        '✨',
        { fontSize: '24px' }
      );
      sparkle.setOrigin(0.5);
      this.container.add(sparkle);

      this.scene.tweens.add({
        targets: sparkle,
        alpha: 0.3,
        duration: 300 + Math.random() * 300,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    color: number,
    callback: () => void,
    small: boolean = false
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const width = small ? 150 : 220;
    const height = small ? 35 : 50;
    const fontSize = small ? '18px' : '24px';

    const bg = this.scene.add.rectangle(0, 0, width, height, color);
    bg.setStrokeStyle(3, COLORS.darkBlue);
    bg.setInteractive({ useHandCursor: true });

    const buttonText = this.scene.add.text(0, 0, text, {
      fontSize,
      color: '#333333',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);

    container.add([bg, buttonText]);

    bg.on('pointerover', () => {
      bg.setAlpha(0.8);
    });
    bg.on('pointerout', () => {
      bg.setAlpha(1);
    });
    bg.on('pointerdown', callback);

    return container;
  }

  destroy(): void {
    this.container.destroy();
  }
}
