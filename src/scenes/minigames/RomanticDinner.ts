import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../config';
import { TUNING } from '../../constants/tuning';

interface DialoguePrompt {
  question: string;
  answers: { text: string; points: number }[];
}

const PROMPTS: DialoguePrompt[] = [
  {
    question: "What made today special?",
    answers: [
      { text: "Being with you made everything perfect", points: 20 },
      { text: "The beautiful views", points: 10 },
      { text: "The food was good", points: 5 },
    ],
  },
  {
    question: "What's your favorite memory from our adventure?",
    answers: [
      { text: "Every moment we shared together", points: 20 },
      { text: "When we laughed at the sailing", points: 15 },
      { text: "Taking photos at sunset", points: 10 },
    ],
  },
  {
    question: "What do you love most about us?",
    answers: [
      { text: "How we make each other smile", points: 20 },
      { text: "Our adventures together", points: 15 },
      { text: "We have fun", points: 10 },
    ],
  },
  {
    question: "What would you wish for right now?",
    answers: [
      { text: "More moments just like this with you", points: 20 },
      { text: "For this night to never end", points: 15 },
      { text: "Dessert! 🍰", points: 10 },
    ],
  },
  {
    question: "How do you feel right now?",
    answers: [
      { text: "So happy to be here with you ❤️", points: 20 },
      { text: "Grateful for this journey", points: 15 },
      { text: "Full from dinner!", points: 10 },
    ],
  },
  {
    question: "What should we do next time?",
    answers: [
      { text: "Another adventure, anywhere with you", points: 20 },
      { text: "Explore somewhere new together", points: 15 },
      { text: "Stay home and relax", points: 10 },
    ],
  },
];

export class RomanticDinner extends BaseMinigame {
  private loveBar!: Phaser.GameObjects.Rectangle;
  private loveBarBg!: Phaser.GameObjects.Rectangle;
  private loveLevel: number = 0;
  private currentPromptIndex: number = 0;
  private promptContainer!: Phaser.GameObjects.Container;
  private answerButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'RomanticDinner' });
  }

  create(): void {
    // Background - romantic mountain dinner scene
    this.createDinnerBackground();

    // Setup simple HUD (just love bar, no timer for this one)
    this.createLoveBar();

    // Show first prompt
    this.showPrompt();
  }

  private createDinnerBackground(): void {
    // Night sky gradient
    const graphics = this.add.graphics();
    const steps = 15;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.floor(30 + (60 - 30) * ratio);
      const g = Math.floor(20 + (40 - 20) * ratio);
      const b = Math.floor(80 + (100 - 80) * ratio);
      const color = (r << 16) | (g << 8) | b;
      graphics.fillStyle(color);
      graphics.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }

    // Stars
    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(
        Math.random() * GAME_WIDTH,
        Math.random() * (GAME_HEIGHT * 0.4),
        1 + Math.random() * 2,
        COLORS.white,
        0.5 + Math.random() * 0.5
      );
      this.tweens.add({
        targets: star,
        alpha: 0.2,
        duration: 1000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
      });
    }

    // Moon
    this.add.circle(100, 100, 40, 0xFFFACD);
    this.add.circle(100, 100, 60, 0xFFFACD, 0.2);

    // Mountains silhouette
    graphics.fillStyle(0x2a2a4a);
    graphics.beginPath();
    graphics.moveTo(0, GAME_HEIGHT);
    graphics.lineTo(0, 400);
    graphics.lineTo(200, 300);
    graphics.lineTo(400, 380);
    graphics.lineTo(600, 280);
    graphics.lineTo(800, 350);
    graphics.lineTo(1000, 260);
    graphics.lineTo(1280, 320);
    graphics.lineTo(1280, GAME_HEIGHT);
    graphics.closePath();
    graphics.fillPath();

    // Table
    this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 180, 500, 120, 0x8B0000);
    this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 200, 480, 100, 0xFFFFFF);

    // Candles
    this.createCandle(GAME_WIDTH / 2 - 100, GAME_HEIGHT - 250);
    this.createCandle(GAME_WIDTH / 2 + 100, GAME_HEIGHT - 250);

    // Wine glasses
    this.add.text(GAME_WIDTH / 2 - 150, GAME_HEIGHT - 230, '🍷', { fontSize: '32px' });
    this.add.text(GAME_WIDTH / 2 + 120, GAME_HEIGHT - 230, '🍷', { fontSize: '32px' });

    // Rose
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 220, '🌹', { fontSize: '28px' }).setOrigin(0.5);
  }

  private createCandle(x: number, y: number): void {
    // Candle body
    this.add.rectangle(x, y + 20, 15, 40, 0xFFFDD0);

    // Flame
    const flame = this.add.ellipse(x, y - 5, 12, 20, 0xFFA500);
    const flameGlow = this.add.circle(x, y, 25, 0xFFD700, 0.3);

    this.tweens.add({
      targets: [flame, flameGlow],
      scaleX: 0.8,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }

  private createLoveBar(): void {
    const barWidth = 300;
    const barHeight = 30;
    const x = GAME_WIDTH / 2;
    const y = 50;

    // Label
    const label = this.add.text(x - barWidth / 2 - 60, y, '❤️ Love:', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
    });
    label.setOrigin(0, 0.5);

    // Background
    this.loveBarBg = this.add.rectangle(x, y, barWidth, barHeight, 0x555555);
    this.loveBarBg.setStrokeStyle(3, COLORS.white);

    // Fill
    this.loveBar = this.add.rectangle(x - barWidth / 2 + 2, y, 0, barHeight - 4, COLORS.pink);
    this.loveBar.setOrigin(0, 0.5);
  }

  private updateLoveBar(): void {
    const config = TUNING.dinner;
    const maxWidth = this.loveBarBg.width - 4;
    const targetWidth = (this.loveLevel / config.targetLove) * maxWidth;

    this.tweens.add({
      targets: this.loveBar,
      width: targetWidth,
      duration: 300,
      ease: 'Power2',
    });
  }

  private showPrompt(): void {
    const config = TUNING.dinner;

    if (this.currentPromptIndex >= PROMPTS.length) {
      // All prompts answered
      if (this.loveLevel >= config.targetLove) {
        this.showWin();
      } else {
        this.showLose();
      }
      return;
    }

    const prompt = PROMPTS[this.currentPromptIndex];

    // Clear previous
    if (this.promptContainer) {
      this.promptContainer.destroy();
    }
    this.answerButtons.forEach(btn => btn.destroy());
    this.answerButtons = [];

    // Prompt container centered
    this.promptContainer = this.add.container(GAME_WIDTH / 2, 140);

    // Woman avatar and bubble (left)
    const avatarLeft = this.add.text(-260, -20, '👩', { fontSize: '48px' });
    avatarLeft.setOrigin(0.5);

    const bubbleWidth = 520;
    const bubbleHeight = 80;
    const bubble = this.add.rectangle(-120, 0, bubbleWidth, bubbleHeight, COLORS.white, 0.95);
    bubble.setStrokeStyle(3, COLORS.pink);

    const questionText = this.add.text(-120, 0, prompt.question, {
      fontSize: '22px',
      color: '#333333',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      align: 'left',
      wordWrap: { width: bubbleWidth - 40 },
    });
    questionText.setOrigin(0.0, 0.5);

    this.promptContainer.add([avatarLeft, bubble, questionText]);

    // Shuffle answers for variety
    const shuffledAnswers = [...prompt.answers].sort(() => Math.random() - 0.5);

    // Create answer buttons (man's reply options on right)
    shuffledAnswers.forEach((answer, index) => {
      const y = 300 + index * 80;
      const btn = this.createAnswerButton(GAME_WIDTH / 2 + 40, y, answer.text, answer.points);
      this.answerButtons.push(btn);
    });

    // Progress indicator
    const progressText = this.add.text(GAME_WIDTH / 2, 130, `${this.currentPromptIndex + 1} / ${PROMPTS.length}`, {
      fontSize: '18px',
      color: '#AAAAAA',
      fontFamily: 'Arial, sans-serif',
    });
    progressText.setOrigin(0.5);
    this.promptContainer.add(progressText);
  }

  private createAnswerButton(x: number, y: number, text: string, points: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const btnWidth = 550;
    const btnHeight = 60;

    const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, COLORS.lavender);
    bg.setStrokeStyle(3, COLORS.darkBlue);
    bg.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#333333',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: btnWidth - 30 },
    });
    btnText.setOrigin(0.5);

    container.add([bg, btnText]);

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(COLORS.pink);
      this.tweens.add({
        targets: container,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.lavender);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    bg.on('pointerdown', () => this.selectAnswer(points, container));

    return container;
  }

  private selectAnswer(points: number, selectedBtn: Phaser.GameObjects.Container): void {
    if (this.isGameOver) return;

    // Disable all buttons
    this.answerButtons.forEach(btn => {
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      bg.disableInteractive();
    });

    // Highlight selected
    this.tweens.add({
      targets: selectedBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 200,
      yoyo: true,
    });

    // Add love points
    this.loveLevel = Math.min(this.loveLevel + points, TUNING.dinner.targetLove);
    this.updateLoveBar();

    // Show feedback
    this.showAnswerFeedback(points);

    // Move to next prompt after delay
    this.time.delayedCall(1200, () => {
      this.currentPromptIndex++;
      this.showPrompt();
    });
  }

  private showAnswerFeedback(points: number): void {
    let text: string;
    let color: string;

    if (points >= 20) {
      text = '💕 Perfect answer!';
      color = '#FF69B4';
    } else if (points >= 15) {
      text = '💗 Great answer!';
      color = '#FF69B4';
    } else {
      text = '💜 Good answer!';
      color = '#9370DB';
    }

    const feedback = this.add.text(GAME_WIDTH / 2, 550, text, {
      fontSize: '28px',
      color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    feedback.setOrigin(0.5);

    // Hearts floating up
    for (let i = 0; i < 5; i++) {
      const heart = this.add.text(
        GAME_WIDTH / 2 - 100 + Math.random() * 200,
        550,
        '❤️',
        { fontSize: '24px' }
      );

      this.tweens.add({
        targets: heart,
        y: heart.y - 100 - Math.random() * 50,
        alpha: 0,
        duration: 1000,
        delay: i * 100,
        onComplete: () => heart.destroy(),
      });
    }

    this.tweens.add({
      targets: feedback,
      y: feedback.y - 30,
      alpha: 0,
      duration: 1000,
      delay: 500,
      onComplete: () => feedback.destroy(),
    });
  }
}
