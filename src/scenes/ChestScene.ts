import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { DialogueSystem } from '../ui/DialogueSystem';
import { DIALOGUES } from '../constants/dialogues';
import { LEVELS } from '../constants/levels';

export class ChestScene extends Phaser.Scene {
  private messageRevealed: boolean = false;
  private finalMusic?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'ChestScene' });
  }

  create(): void {
    this.messageRevealed = false;

    // Play final victory music
    this.finalMusic = this.sound.add('finalVictoryMusic', { loop: true, volume: 0.7 });
    this.finalMusic.play();

    // Dreamy background
    this.createBackground();

    // Tokens flying in
    this.time.delayedCall(500, () => this.showTokensFlying());
  }

  private createBackground(): void {
    // Gradient background (sunset colors)
    const graphics = this.add.graphics();
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.floor(255 - (255 - 135) * ratio);
      const g = Math.floor(200 - (200 - 100) * ratio);
      const b = Math.floor(150 + (235 - 150) * ratio);
      const color = (r << 16) | (g << 8) | b;
      graphics.fillStyle(color);
      graphics.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }

    // Stars
    for (let i = 0; i < 30; i++) {
      const star = this.add.circle(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT * 0.6,
        2 + Math.random() * 2,
        COLORS.white,
        0.6 + Math.random() * 0.4
      );
      this.tweens.add({
        targets: star,
        alpha: 0.3,
        duration: 500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private showTokensFlying(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2 - 50;

    // Show tokens one by one
    LEVELS.forEach((level, index) => {
      this.time.delayedCall(index * 400, () => {
        // Token starts from edge
        const startX = -50;
        const startY = 100 + index * 50;

        const token = this.add.image(startX, startY, level.tokenImageKey);
        token.setOrigin(0.5);
        const tokenMaxSize = 70;
        const tokenScale = Math.min(tokenMaxSize / token.width, tokenMaxSize / token.height);
        token.setScale(tokenScale);

        // Fly to center in arc
        const targetX = centerX - 100 + (index % 3) * 100;
        const targetY = centerY - 80 + Math.floor(index / 3) * 80;

        this.tweens.add({
          targets: token,
          x: targetX,
          y: targetY,
          duration: 800,
          ease: 'Back.easeOut',
          onComplete: () => {
            // Sparkle effect
            this.createSparkle(targetX, targetY);

            // After all tokens, show chest
            if (index === 5) {
              this.time.delayedCall(600, () => this.showChest());
            }
          },
        });
      });
    });
  }

  private createSparkle(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sparkle = this.add.circle(x, y, 4, COLORS.gold);
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

    // Chest (simple rectangle representation)
    const chestContainer = this.add.container(centerX, centerY + 80);

    // Chest base
    const chestBase = this.add.rectangle(0, 20, 120, 60, 0x8B4513);
    chestBase.setStrokeStyle(3, 0x654321);

    // Chest lid (closed)
    const chestLid = this.add.rectangle(0, -15, 130, 40, 0xA0522D);
    chestLid.setStrokeStyle(3, 0x654321);

    // Gold clasp
    const clasp = this.add.circle(0, 5, 12, COLORS.gold);
    clasp.setStrokeStyle(2, 0xB8860B);

    chestContainer.add([chestBase, chestLid, clasp]);
    chestContainer.setScale(0);

    // Animate chest appearing
    this.tweens.add({
      targets: chestContainer,
      scaleX: 1.5,
      scaleY: 1.5,
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

        // Pulse animation
        this.tweens.add({
          targets: clickText,
          alpha: 0.5,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });

        // Make chest clickable
        chestLid.setInteractive({ useHandCursor: true });
        chestLid.on('pointerdown', () => {
          if (!this.messageRevealed) {
            this.messageRevealed = true;
            clickText.destroy();
            this.openChest(chestContainer, chestLid);
          }
        });
      },
    });
  }

  private openChest(container: Phaser.GameObjects.Container, lid: Phaser.GameObjects.Rectangle): void {
    // Animate lid opening
    this.tweens.add({
      targets: lid,
      y: lid.y - 50,
      angle: -30,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Light burst
        this.createLightBurst(container.x, container.y);

        // Start final reward dialogue, then show message
        const ds = new DialogueSystem(this);
        ds.startDialogue(DIALOGUES.finalReward, 'Judy').then(() => {
          ds.destroy();
          this.time.delayedCall(400, () => this.showMessage());
        });
      },
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

  private showMessage(): void {
    // Message card
    const cardWidth = 700;
    const cardHeight = 400;
    const card = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      cardWidth,
      cardHeight,
      COLORS.cream
    );
    card.setStrokeStyle(5, COLORS.pink);
    card.setAlpha(0);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, 'Happy Birthday, Trisha! 💙', {
      fontSize: '42px',
      color: '#FF69B4',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setAlpha(0);

    // Message body (placeholder - you can customize this!)
    const message = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'Thank you for going on this little adventure with me!\n\n' +
        'Every moment with you is like collecting\n' +
        'precious memories on our journey together.\n\n' +
        'Here\'s to many more adventures! 🌟',
      {
        fontSize: '24px',
        color: '#555555',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        lineSpacing: 8,
      }
    );
    message.setOrigin(0.5);
    message.setAlpha(0);

    // Footer
    const footer = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, 'With love ❤️', {
      fontSize: '26px',
      color: '#FF69B4',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic',
    });
    footer.setOrigin(0.5);
    footer.setAlpha(0);

    // Fade in message
    this.tweens.add({
      targets: [card, title, message, footer],
      alpha: 1,
      duration: 1000,
      onComplete: () => {
        // Add replay button after message shown
        this.time.delayedCall(1500, () => this.addEndButtons());
      },
    });
  }

  private addEndButtons(): void {
    // Replay Journey button
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'Play Again', () => {
      // Stop music and go to map
      if (this.finalMusic) {
        this.finalMusic.stop();
      }
      this.scene.start('MapScene');
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const bg = this.add.rectangle(x, y, 200, 50, COLORS.pink);
    bg.setStrokeStyle(3, COLORS.coral);
    bg.setInteractive({ useHandCursor: true });
    bg.setAlpha(0);

    const buttonText = this.add.text(x, y, text, {
      fontSize: '24px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);
    buttonText.setAlpha(0);

    this.tweens.add({
      targets: [bg, buttonText],
      alpha: 1,
      duration: 500,
    });

    bg.on('pointerover', () => {
      bg.setFillStyle(COLORS.coral);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.pink);
    });
    bg.on('pointerdown', callback);
  }
}
