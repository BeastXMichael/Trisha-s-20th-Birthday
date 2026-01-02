import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../config';
import { TUNING } from '../../constants/tuning';

export class FrameMoment extends BaseMinigame {
  private cameraFrame!: Phaser.GameObjects.Container;
  private subjects: Phaser.GameObjects.Container[] = [];
  private currentSubjectIndex: number = 0;
  private progress: number = 0;
  private frameDirection: number = 1;
  private frameSpeed: number = 0;

  constructor() {
    super({ key: 'FrameMoment' });
  }

  create(): void {
    const config = TUNING.photo;
    this.frameSpeed = config.frameSpeed;

    // Background - sunset scene
    this.createSunsetBackground();

    // Setup HUD
    this.setupHUD({
      showTimer: true,
      timerSeconds: config.gameDuration,
      showProgress: true,
      progressLabel: 'Photos:',
    });

    // Create subjects to photograph
    this.createSubjects();

    // Create camera frame overlay
    this.createCameraFrame();

    // Instructions
    const instructions = this.add.text(GAME_WIDTH / 2, 80, 'Click to snap when the frame is centered on the subject!', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#00000088',
      padding: { x: 20, y: 10 },
    });
    instructions.setOrigin(0.5);

    // Setup controls
    this.input.on('pointerdown', () => this.takePhoto());
    this.input.keyboard?.on('keydown-SPACE', () => this.takePhoto());

    // Start timer
    this.startTimer(config.gameDuration, () => {
      if (this.progress >= config.targetProgress) {
        this.showWin();
      } else {
        this.showLose();
      }
    });
  }

  private createSunsetBackground(): void {
    // Sunset gradient
    const graphics = this.add.graphics();
    const steps = 15;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.floor(255 - (255 - 100) * ratio * ratio);
      const g = Math.floor(180 - (180 - 50) * ratio);
      const b = Math.floor(100 + (150 - 100) * ratio);
      const color = (r << 16) | (g << 8) | b;
      graphics.fillStyle(color);
      graphics.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }

    // Sun
    const sun = this.add.circle(GAME_WIDTH - 200, 200, 80, 0xFFD700, 0.8);
    this.tweens.add({
      targets: sun,
      y: sun.y + 10,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Sun glow
    const glow = this.add.circle(GAME_WIDTH - 200, 200, 120, 0xFFA500, 0.3);
    this.tweens.add({
      targets: glow,
      alpha: 0.1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // Ground/horizon
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 100, GAME_WIDTH, 200, 0x2F4F4F);

    // Silhouette buildings/trees
    for (let i = 0; i < 10; i++) {
      const treeX = i * 140 + 50;
      const treeHeight = 100 + Math.random() * 80;
      const tree = this.add.triangle(treeX, GAME_HEIGHT - 100, 0, 0, 30, treeHeight, -30, treeHeight, 0x1a1a1a);
      tree.setOrigin(0.5, 1);
    }
  }

  private createSubjects(): void {
    // Create subjects at different positions
    const subjectData = [
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, emoji: '💑', label: 'Couple' },
      { x: GAME_WIDTH / 3, y: GAME_HEIGHT / 2 + 50, emoji: '🌸', label: 'Flowers' },
      { x: (GAME_WIDTH * 2) / 3, y: GAME_HEIGHT / 2 - 30, emoji: '🦋', label: 'Butterfly' },
    ];

    subjectData.forEach((data, index) => {
      const container = this.add.container(data.x, data.y);

      // Subject circle/glow
      const glow = this.add.circle(0, 0, 60, COLORS.gold, 0.2);
      const subject = this.add.text(0, 0, data.emoji, { fontSize: '64px' });
      subject.setOrigin(0.5);

      container.add([glow, subject]);
      container.setVisible(index === 0); // Only show first subject

      this.subjects.push(container);
    });
  }

  private createCameraFrame(): void {
    this.cameraFrame = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // Semi-transparent overlay with hole
    const frameWidth = 200;
    const frameHeight = 150;

    // Frame corners
    // Top-left corner
    this.addCorner(-frameWidth / 2, -frameHeight / 2, 1, 1);
    // Top-right corner
    this.addCorner(frameWidth / 2, -frameHeight / 2, -1, 1);
    // Bottom-left corner
    this.addCorner(-frameWidth / 2, frameHeight / 2, 1, -1);
    // Bottom-right corner
    this.addCorner(frameWidth / 2, frameHeight / 2, -1, -1);

    // Center crosshair
    const crossH = this.add.rectangle(0, 0, 40, 2, COLORS.white, 0.5);
    const crossV = this.add.rectangle(0, 0, 2, 40, COLORS.white, 0.5);
    this.cameraFrame.add([crossH, crossV]);

    // Camera icon
    const cameraIcon = this.add.text(0, frameHeight / 2 + 40, '📷', { fontSize: '32px' });
    cameraIcon.setOrigin(0.5);
    this.cameraFrame.add(cameraIcon);
  }

  private addCorner(x: number, y: number, dirX: number, dirY: number): void {
    const size = 30;
    const thickness = 4;

    const h = this.add.rectangle(x + (dirX * size) / 2, y, size, thickness, COLORS.white);
    const v = this.add.rectangle(x, y + (dirY * size) / 2, thickness, size, COLORS.white);

    this.cameraFrame.add([h, v]);
  }

  private takePhoto(): void {
    if (this.isGameOver) return;

    const config = TUNING.photo;
    const currentSubject = this.subjects[this.currentSubjectIndex];

    // Calculate distance from frame center to subject center
    const distance = Math.abs(this.cameraFrame.x - currentSubject.x);

    let rating: 'perfect' | 'good' | 'miss';
    let points: number;

    if (distance < config.perfectWindow) {
      rating = 'perfect';
      points = config.perfectPoints;
    } else if (distance < config.goodWindow) {
      rating = 'good';
      points = config.goodPoints;
    } else {
      rating = 'miss';
      points = config.missPoints;
    }

    // Add points
    this.progress = Math.min(this.progress + points, config.targetProgress);
    this.hud.setProgress(this.progress, config.targetProgress);

    // Show feedback
    this.showPhotoFeedback(rating);

    // Flash effect
    this.createFlashEffect();

    // Move to next subject or reposition current
    this.advanceSubject();

    // Check for win
    if (this.progress >= config.targetProgress) {
      this.showWin();
    }
  }

  private showPhotoFeedback(rating: 'perfect' | 'good' | 'miss'): void {
    const texts = {
      perfect: { text: '✨ Perfect! ✨', color: '#FFD700' },
      good: { text: 'Good!', color: '#66FF66' },
      miss: { text: 'Try again', color: '#FF9999' },
    };

    const { text, color } = texts[rating];

    const feedback = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, text, {
      fontSize: '36px',
      color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    feedback.setOrigin(0.5);

    this.tweens.add({
      targets: feedback,
      y: feedback.y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => feedback.destroy(),
    });
  }

  private createFlashEffect(): void {
    const flash = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLORS.white,
      0.8
    );
    flash.setDepth(50);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  private advanceSubject(): void {
    // Hide current subject
    this.subjects[this.currentSubjectIndex].setVisible(false);

    // Move to next subject (cycle)
    this.currentSubjectIndex = (this.currentSubjectIndex + 1) % this.subjects.length;

    // Randomize position slightly
    const subject = this.subjects[this.currentSubjectIndex];
    subject.x = GAME_WIDTH / 3 + Math.random() * (GAME_WIDTH / 3);
    subject.y = GAME_HEIGHT / 2 - 50 + Math.random() * 100;
    subject.setVisible(true);

    // Reset frame to a side
    this.cameraFrame.x = Math.random() > 0.5 ? 100 : GAME_WIDTH - 100;
    this.frameDirection = this.cameraFrame.x < GAME_WIDTH / 2 ? 1 : -1;
  }

  update(): void {
    if (this.isGameOver) return;

    // Move camera frame back and forth
    this.cameraFrame.x += this.frameSpeed * this.frameDirection * (this.game.loop.delta / 1000);

    // Bounce off edges
    if (this.cameraFrame.x > GAME_WIDTH - 100) {
      this.cameraFrame.x = GAME_WIDTH - 100;
      this.frameDirection = -1;
    } else if (this.cameraFrame.x < 100) {
      this.cameraFrame.x = 100;
      this.frameDirection = 1;
    }
  }
}
