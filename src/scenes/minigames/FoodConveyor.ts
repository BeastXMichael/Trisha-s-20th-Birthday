import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../config';
import { TUNING } from '../../constants/tuning';

interface FoodItem {
  container: Phaser.GameObjects.Container;
  isMexican: boolean;
}

const MEXICAN_FOODS = ['🌮', '🌯', '🫔', '🌶️', '🥑'];
const OTHER_FOODS = ['🍕', '🍔', '🍣', '🍜', '🍩', '🍦', '🍗'];

export class FoodConveyor extends BaseMinigame {
  private foods: FoodItem[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;
  private score: number = 0;

  constructor() {
    super({ key: 'FoodConveyor' });
  }

  create(): void {
    const config = TUNING.food;

    // Background - restaurant theme
    this.createRestaurantBackground();

    // Setup HUD
    this.setupHUD({
      showHealth: true,
      maxHealth: config.startingHealth,
      showTimer: true,
      timerSeconds: config.gameDuration,
      showScore: true,
      targetScore: config.targetScore,
    });

    // Instructions text
    const instructions = this.add.text(GAME_WIDTH / 2, 100, 'Click the Mexican foods! 🌮🌯🫔🌶️🥑', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#00000088',
      padding: { x: 20, y: 10 },
    });
    instructions.setOrigin(0.5);

    // Start spawning foods
    this.startSpawning();

    // Start timer
    this.startTimer(config.gameDuration, () => {
      // Check if target reached
      if (this.score >= config.targetScore) {
        this.showWin();
      } else {
        this.showLose();
      }
    });
  }

  private createRestaurantBackground(): void {
    // Warm restaurant colors
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFF5E6);

    // Conveyor belt
    const beltY = GAME_HEIGHT / 2 + 50;
    const belt = this.add.rectangle(GAME_WIDTH / 2, beltY, GAME_WIDTH + 100, 150, 0x555555);
    belt.setStrokeStyle(4, 0x333333);

    // Belt details (metallic strips)
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      const strip = this.add.rectangle(x, beltY, 3, 150, 0x666666);
      // Animate strips moving
      this.tweens.add({
        targets: strip,
        x: strip.x + 40,
        duration: 800,
        repeat: -1,
      });
    }

    // Decorative elements
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, '🇲🇽 Mexican Restaurant 🇲🇽', {
      fontSize: '28px',
      color: '#CC6600',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
  }

  private startSpawning(): void {
    const config = TUNING.food;

    this.spawnTimer = this.time.addEvent({
      delay: config.spawnInterval,
      callback: () => this.spawnFood(),
      loop: true,
    });

    // Spawn initial food
    this.spawnFood();
  }

  private spawnFood(): void {
    if (this.isGameOver) return;

    const config = TUNING.food;

    // Determine if Mexican food
    const isMexican = Math.random() < config.mexicanFoodRatio;
    const foodEmoji = isMexican
      ? MEXICAN_FOODS[Phaser.Math.Between(0, MEXICAN_FOODS.length - 1)]
      : OTHER_FOODS[Phaser.Math.Between(0, OTHER_FOODS.length - 1)];

    const y = GAME_HEIGHT / 2 + 50 + Phaser.Math.Between(-40, 40);

    const container = this.add.container(-60, y);

    // Plate
    const plate = this.add.circle(0, 0, 45, COLORS.white);
    plate.setStrokeStyle(3, isMexican ? COLORS.gold : 0xCCCCCC);

    // Food emoji
    const food = this.add.text(0, 0, foodEmoji, {
      fontSize: '48px',
    });
    food.setOrigin(0.5);

    // Glow effect for Mexican foods
    if (isMexican) {
      const glow = this.add.circle(0, 0, 50, COLORS.gold, 0.3);
      container.add(glow);

      this.tweens.add({
        targets: glow,
        alpha: 0.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    container.add([plate, food]);

    // Make interactive
    plate.setInteractive({ useHandCursor: true });
    plate.on('pointerdown', () => this.tapFood(container, isMexican));

    this.foods.push({ container, isMexican });
  }

  private tapFood(container: Phaser.GameObjects.Container, isMexican: boolean): void {
    if (this.isGameOver) return;

    const config = TUNING.food;

    if (isMexican) {
      // Correct! Add points
      this.score += config.pointsPerCorrect;
      this.hud.setScore(this.score);

      // Happy feedback
      this.showFeedback(container.x, container.y, '+1 ✓', COLORS.mint);

      // Check for win
      if (this.score >= config.targetScore) {
        this.spawnTimer?.destroy();
        this.showWin();
      }
    } else {
      // Wrong! Lose health
      const newHealth = this.hud.getHealth() - 1;
      this.hud.setHealth(newHealth);

      // Sad feedback
      this.showFeedback(container.x, container.y, '✗', COLORS.coral);

      if (newHealth <= 0) {
        this.spawnTimer?.destroy();
        this.showLose();
      }
    }

    // Remove the food
    this.removeFood(container);
  }

  private showFeedback(x: number, y: number, text: string, color: number): void {
    const feedback = this.add.text(x, y - 30, text, {
      fontSize: '32px',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    feedback.setOrigin(0.5);

    this.tweens.add({
      targets: feedback,
      y: y - 80,
      alpha: 0,
      duration: 600,
      onComplete: () => feedback.destroy(),
    });
  }

  private removeFood(container: Phaser.GameObjects.Container): void {
    // Pop animation
    this.tweens.add({
      targets: container,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        const index = this.foods.findIndex(f => f.container === container);
        if (index !== -1) {
          this.foods.splice(index, 1);
        }
        container.destroy();
      },
    });
  }

  update(): void {
    if (this.isGameOver) return;

    const config = TUNING.food;
    const speed = config.beltSpeed * (this.game.loop.delta / 1000);

    // Move foods along conveyor
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const food = this.foods[i];
      food.container.x += speed;

      // Remove if off screen
      if (food.container.x > GAME_WIDTH + 60) {
        food.container.destroy();
        this.foods.splice(i, 1);
      }
    }
  }

}
