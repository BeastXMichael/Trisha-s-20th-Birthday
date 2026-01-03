import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { DialogueSystem } from '../ui/DialogueSystem';
import { DIALOGUES } from '../constants/dialogues';
import { LEVELS } from '../constants/levels';

export class ChestScene extends Phaser.Scene {
  private messageRevealed: boolean = false;
  private finalMusic?: Phaser.Sound.BaseSound;
  private resumeAfterMessage: boolean = false;
  private tokens: Phaser.GameObjects.Image[] = [];
  private endOverlay?: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'ChestScene' });
  }

  init(data: { resumeAfterMessage?: boolean }): void {
    this.resumeAfterMessage = Boolean(data?.resumeAfterMessage);
  }

  create(): void {
    this.messageRevealed = false;

    if (!this.resumeAfterMessage) {
      // Play final victory music once during cards phase
      this.finalMusic = this.sound.add('finalVictoryMusic', { loop: false, volume: 0.7 });
      this.finalMusic.play();
    }

    // Background
    this.createBackground();

    if (this.resumeAfterMessage) {
      this.showChestAfterMessage();
      return;
    }

    // Tokens flying in
    this.time.delayedCall(500, () => this.showTokensFlying());
  }

  private createBackground(): void {
    const mapBg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'gameMap');
    const scaleX = GAME_WIDTH / mapBg.width;
    const scaleY = GAME_HEIGHT / mapBg.height;
    const scale = Math.max(scaleX, scaleY);
    mapBg.setScale(scale);
    mapBg.setDepth(0);

    const dimmer = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);
    dimmer.setDepth(1);
  }

  private showTokensFlying(): void {
    const centerY = GAME_HEIGHT / 2;
    const marginX = 120;
    const usableWidth = GAME_WIDTH - marginX * 2;
    const step = usableWidth / (LEVELS.length - 1);
    const tokenMaxSize = Math.min(step * 0.9, GAME_HEIGHT * 0.3);

    // Show tokens one by one across the full width
    LEVELS.forEach((level, index) => {
      this.time.delayedCall(index * 400, () => {
        const targetX = marginX + step * index;
        const targetY = centerY;
        const startX = -120;

        const token = this.add.image(startX, targetY, level.tokenImageKey);
        token.setOrigin(0.5);
        const tokenScale = Math.min(tokenMaxSize / token.width, tokenMaxSize / token.height);
        token.setScale(tokenScale);
        token.setDepth(10);
        this.tokens.push(token);

        this.sound.play('tokenSlideSound');
        this.tweens.add({
          targets: token,
          x: targetX,
          duration: 900,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            // Sparkle effect
            this.createSparkle(targetX, targetY);

            // After all tokens, show chest
            if (index === 5) {
              this.time.delayedCall(3000, () => this.flashToChest());
            }
          },
        });
      });
    });
  }

  private flashToChest(): void {
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1)
      .setAlpha(0)
      .setDepth(5000)
      .setScrollFactor(0);

    // Fade IN fast (flash hit)
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 120,
      ease: 'Linear',
      onComplete: () => {
        // HOLD at full white
        this.time.delayedCall(80, () => {
          // Fade OUT slower (recovery)
          this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 350,
            ease: 'Linear',
            onComplete: () => {
              overlay.destroy();
              this.tokens.forEach((token) => token.destroy());
              this.tokens = [];
              this.showChest();
            },
          });
        });
      },
    });
  }

  private createSparkle(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sparkle = this.add.circle(x, y, 4, COLORS.gold);
      sparkle.setDepth(10);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        duration: 500,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private showChest(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const chest = this.add.image(centerX, centerY, 'chestImage');
    chest.setOrigin(0.5);
    const maxSize = 540;
    const scale = Math.min(maxSize / chest.width, maxSize / chest.height);
    chest.setScale(0);
    chest.setDepth(10);

    // Animate chest appearing
    this.tweens.add({
      targets: chest,
      scaleX: scale,
      scaleY: scale,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Prompt to open
        const clickText = this.add.text(centerX, centerY + 180, 'Click to open!', {
          fontSize: '24px',
          color: '#FFFFFF',
          fontFamily: 'Arial, sans-serif',
        });
        clickText.setOrigin(0.5);
        clickText.setDepth(10);

        // Pulse animation
        this.tweens.add({
          targets: clickText,
          alpha: 0.5,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });

        // Make chest clickable
        chest.setInteractive({ useHandCursor: true });
        chest.on('pointerdown', () => {
          if (!this.messageRevealed) {
            this.messageRevealed = true;
            clickText.destroy();
            this.openChest(chest);
          }
        });
      },
    });
  }

  private openChest(chest: Phaser.GameObjects.Image): void {
    // Animate chest
    this.tweens.add({
      targets: chest,
      scaleX: chest.scaleX * 1.05,
      scaleY: chest.scaleY * 1.05,
      yoyo: true,
      duration: 400,
      ease: 'Sine.easeInOut',
    });

    // Light burst
    this.createLightBurst(chest.x, chest.y);

    if (this.finalMusic) {
      this.finalMusic.stop();
    }
    this.cameras.main.fadeOut(450, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MessageScene');
    });
  }

  private showChestAfterMessage(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const chest = this.add.image(centerX, centerY, 'chestImage');
    chest.setOrigin(0.5);
    const maxSize = 540;
    const scale = Math.min(maxSize / chest.width, maxSize / chest.height);
    chest.setScale(0);
    chest.setDepth(10);

    this.tweens.add({
      targets: chest,
      scaleX: scale,
      scaleY: scale,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.startJudyDialogueOnly();
      },
    });
  }

  private startJudyDialogueOnly(): void {
    const ds = new DialogueSystem(this);
    ds.startDialogue(DIALOGUES.finalReward, 'Judy').then(() => {
      ds.destroy();
      this.showEndScreen();
    });
  }

  private showEndScreen(): void {
    this.endOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55);
    this.endOverlay.setDepth(50);
    this.endOverlay.setInteractive();

    const endText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'THE END', {
      fontSize: '48px',
      color: '#FFFFFF',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontStyle: 'bold',
    });
    endText.setOrigin(0.5);
    endText.setDepth(51);

    this.endOverlay.on('pointerdown', () => {
      this.sound.stopByKey('messageMusic');
      this.sound.stopByKey('finalVictoryMusic');
      this.scene.start('MapScene');
    });
  }

  private createLightBurst(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const ray = this.add.rectangle(x, y - 20, 8, 60, COLORS.gold, 0.8);
      ray.setOrigin(0.5, 1);
      ray.setAngle((angle * 180) / Math.PI);

      this.tweens.add({
        targets: ray,
        scaleY: 2,
        alpha: 0,
        duration: 800,
        onComplete: () => ray.destroy(),
      });
    }
  }

}
