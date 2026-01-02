import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../config';

export interface HUDConfig {
  showHealth?: boolean;
  maxHealth?: number;
  showTimer?: boolean;
  timerSeconds?: number;
  showScore?: boolean;
  targetScore?: number;
  showProgress?: boolean;
  progressLabel?: string;
}

export class HUD {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private config: HUDConfig;

  private healthHearts: Phaser.GameObjects.Text[] = [];
  private timerText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private progressBar?: Phaser.GameObjects.Rectangle;
  private progressBg?: Phaser.GameObjects.Rectangle;
  private progressLabel?: Phaser.GameObjects.Text;

  private currentHealth: number = 0;
  private currentTimer: number = 0;
  private currentScore: number = 0;
  private currentProgress: number = 0;

  constructor(scene: Phaser.Scene, config: HUDConfig) {
    this.scene = scene;
    this.config = config;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);

    this.createHUD();
  }

  private createHUD(): void {
    // Background strip at top
    const bgStrip = this.scene.add.rectangle(GAME_WIDTH / 2, 30, GAME_WIDTH, 60, 0x000000, 0.3);
    this.container.add(bgStrip);

    // Health hearts (top left)
    if (this.config.showHealth) {
      this.currentHealth = this.config.maxHealth || 3;
      for (let i = 0; i < (this.config.maxHealth || 3); i++) {
        const heart = this.scene.add.text(30 + i * 40, 25, '❤️', {
          fontSize: '28px',
        });
        this.healthHearts.push(heart);
        this.container.add(heart);
      }
    }

    // Timer (top center)
    if (this.config.showTimer) {
      this.currentTimer = this.config.timerSeconds || 60;
      this.timerText = this.scene.add.text(GAME_WIDTH / 2, 30, this.formatTime(this.currentTimer), {
        fontSize: '32px',
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      });
      this.timerText.setOrigin(0.5);
      this.container.add(this.timerText);
    }

    // Score (top right)
    if (this.config.showScore) {
      const target = this.config.targetScore || 0;
      this.scoreText = this.scene.add.text(GAME_WIDTH - 30, 30, `0 / ${target}`, {
        fontSize: '26px',
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      });
      this.scoreText.setOrigin(1, 0.5);
      this.container.add(this.scoreText);
    }

    // Progress bar (if needed, e.g., for matcha foam or love bar)
    if (this.config.showProgress) {
      const barWidth = 200;
      const barHeight = 20;
      const barX = GAME_WIDTH - 30 - barWidth;
      const barY = 30;

      this.progressBg = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x555555);
      this.progressBg.setOrigin(0, 0.5);
      this.container.add(this.progressBg);

      this.progressBar = this.scene.add.rectangle(barX, barY, 0, barHeight - 4, COLORS.mint);
      this.progressBar.setOrigin(0, 0.5);
      this.container.add(this.progressBar);

      if (this.config.progressLabel) {
        this.progressLabel = this.scene.add.text(barX - 10, barY, this.config.progressLabel, {
          fontSize: '16px',
          color: '#FFFFFF',
          fontFamily: 'Arial, sans-serif',
        });
        this.progressLabel.setOrigin(1, 0.5);
        this.container.add(this.progressLabel);
      }
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  setHealth(health: number): void {
    this.currentHealth = health;
    this.healthHearts.forEach((heart, index) => {
      heart.setText(index < health ? '❤️' : '🖤');
    });
  }

  getHealth(): number {
    return this.currentHealth;
  }

  setTimer(seconds: number): void {
    this.currentTimer = seconds;
    if (this.timerText) {
      this.timerText.setText(this.formatTime(seconds));
      // Flash red when low
      if (seconds <= 10) {
        this.timerText.setColor('#FF6666');
      }
    }
  }

  getTimer(): number {
    return this.currentTimer;
  }

  setScore(score: number): void {
    this.currentScore = score;
    if (this.scoreText) {
      const target = this.config.targetScore || 0;
      this.scoreText.setText(`${score} / ${target}`);
      // Flash green when target reached
      if (score >= target) {
        this.scoreText.setColor('#66FF66');
      }
    }
  }

  getScore(): number {
    return this.currentScore;
  }

  setProgress(progress: number, max: number = 100): void {
    this.currentProgress = progress;
    if (this.progressBar && this.progressBg) {
      const ratio = Math.min(progress / max, 1);
      this.progressBar.width = (this.progressBg.width - 4) * ratio;
    }
  }

  getProgress(): number {
    return this.currentProgress;
  }

  destroy(): void {
    this.container.destroy();
  }
}
