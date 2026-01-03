import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../config';
import { TUNING } from '../../constants/tuning';

interface Target {
  circle: Phaser.GameObjects.Arc;
  rowIndex: number;
  hit: boolean;
}

export class SailBetweenLights extends BaseMinigame {
  private boat!: Phaser.GameObjects.Container;
  private targets: Target[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;
  private gatesPassed: number = 0;
  private laneYs: number[] = [];
  private currentLaneIndex: number = 1;
  private startTime: number = 0;
  private baseTargetSpeed: number = 0;

  constructor() {
    super({ key: 'SailBetweenLights' });
  }

  create(): void {
    const config = TUNING.sailing;

    // Background - evening water scene
    this.createWaterBackground();

    // Setup HUD
    this.setupHUD({
      showTimer: true,
      timerSeconds: config.gameDuration,
      showScore: true,
      targetScore: config.targetGates,
    });

    // Create boat
    this.createBoat();

    // Setup controls
    this.input.keyboard?.on('keydown-UP', () => this.moveLane(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.moveLane(1));

    // Instructions
    const instructions = this.add.text(GAME_WIDTH / 2, 100, 'Use ↑/↓ to jump lanes and hit the glowing circle!', {
      fontSize: '22px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#00000088',
      padding: { x: 20, y: 10 },
    });
    instructions.setOrigin(0.5);

    // Start spawning gates
    this.startSpawning();

    // Start timer
    this.startTimer(config.gameDuration, () => {
      if (this.gatesPassed >= config.targetGates) {
        this.showWin();
      } else {
        this.showLose();
      }
    });

    this.startTime = this.time.now;
    this.baseTargetSpeed = config.boatSpeed;
  }

  private createWaterBackground(): void {
    // Evening sky gradient
    const graphics = this.add.graphics();
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.floor(255 - (255 - 100) * ratio);
      const g = Math.floor(150 - (150 - 100) * ratio);
      const b = Math.floor(100 + (200 - 100) * ratio);
      const color = (r << 16) | (g << 8) | b;
      graphics.fillStyle(color);
      graphics.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }

    // Water waves (animated rectangles)
    for (let y = GAME_HEIGHT / 2; y < GAME_HEIGHT; y += 30) {
      for (let x = 0; x < GAME_WIDTH; x += 100) {
        const wave = this.add.ellipse(x, y, 80, 15, 0x1E90FF, 0.3);
        this.tweens.add({
          targets: wave,
          x: wave.x + 20,
          y: wave.y + 5,
          duration: 2000 + Math.random() * 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // City lights in background (MBS reference)
    for (let i = 0; i < 8; i++) {
      const buildingX = 100 + i * 150;
      const buildingHeight = 80 + Math.random() * 60;
      const building = this.add.rectangle(buildingX, 180, 60, buildingHeight, 0x333366, 0.7);
      building.setOrigin(0.5, 1);

      // Windows/lights
      for (let w = 0; w < 4; w++) {
        const windowLight = this.add.rectangle(
          buildingX - 15 + (w % 2) * 30,
          180 - 20 - Math.floor(w / 2) * 25,
          8,
          8,
          COLORS.gold,
          0.8
        );
        this.tweens.add({
          targets: windowLight,
          alpha: 0.3,
          duration: 500 + Math.random() * 500,
          yoyo: true,
          repeat: -1,
        });
      }
    }

    this.laneYs = [
      GAME_HEIGHT / 2 - 120,
      GAME_HEIGHT / 2 - 30,
      GAME_HEIGHT / 2 + 60,
      GAME_HEIGHT / 2 + 150,
    ];

    this.laneYs.forEach((laneY) => {
      const line = this.add.rectangle(GAME_WIDTH / 2, laneY, GAME_WIDTH, 2, COLORS.white, 0.15);
      line.setDepth(1);
    });
  }

  private createBoat(): void {
    const x = 200;
    const y = this.laneYs[this.currentLaneIndex];

    this.boat = this.add.container(x, y);

    // Boat hull
    const hull = this.add.polygon(0, 0, [
      -40, 0,
      -30, 25,
      30, 25,
      40, 0,
      30, -10,
      -30, -10,
    ], COLORS.cream);
    hull.setStrokeStyle(3, 0x8B4513);

    // Sail
    const sail = this.add.triangle(0, -40, 0, 0, 40, 40, 0, 80, COLORS.white);
    sail.setStrokeStyle(2, COLORS.lightBlue);

    // Mast
    const mast = this.add.rectangle(0, -20, 5, 80, 0x8B4513);

    // Flag
    const flag = this.add.triangle(3, -55, 0, 0, 20, 5, 0, 10, COLORS.pink);

    this.boat.add([hull, mast, sail, flag]);

    // Gentle bob animation
    this.tweens.add({
      targets: this.boat,
      y: y - 5,
      rotation: 0.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private startSpawning(): void {
    const config = TUNING.sailing;

    this.spawnTimer = this.time.addEvent({
      delay: config.gateSpawnInterval,
      callback: () => this.spawnTarget(),
      loop: true,
    });

    // Spawn initial gate
    this.time.delayedCall(500, () => this.spawnTarget());
  }

  private spawnTarget(): void {
    if (this.isGameOver) return;

    const rowIndex = Phaser.Math.Between(0, this.laneYs.length - 1);
    const circle = this.add.circle(GAME_WIDTH + 60, this.laneYs[rowIndex], 22, COLORS.gold, 0.9);
    circle.setStrokeStyle(3, COLORS.white);

    this.tweens.add({
      targets: circle,
      alpha: 0.4,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.targets.push({
      circle,
      rowIndex,
      hit: false,
    });
  }

  update(): void {
    if (this.isGameOver) return;

    const config = TUNING.sailing;
    const delta = this.game.loop.delta / 1000;
    const elapsedSeconds = (this.time.now - this.startTime) / 1000;
    const speedMultiplier = 1 + 0.5 * Math.min(elapsedSeconds / 30, 1);
    const targetSpeed = this.baseTargetSpeed * speedMultiplier;

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      target.circle.x -= targetSpeed * delta;

      if (!target.hit) {
        const dx = Math.abs(target.circle.x - this.boat.x);
        if (dx < 30 && target.rowIndex === this.currentLaneIndex) {
          target.hit = true;
          this.gatesPassed++;
          this.hud.setScore(this.gatesPassed);
          this.showGateFeedback(target.circle.x, target.circle.y, true);

          if (this.gatesPassed >= config.targetGates) {
            this.spawnTimer?.destroy();
            this.showWin();
          }
        }
      }

      if (!target.hit && target.circle.x < this.boat.x - 40) {
        target.hit = true;
        this.showGateFeedback(target.circle.x, target.circle.y, false);
      }

      if (target.circle.x < -60) {
        target.circle.destroy();
        this.targets.splice(i, 1);
      }
    }
  }

  private showGateFeedback(x: number, y: number, success: boolean): void {
    const text = success ? '✓' : '✗';
    const color = success ? '#66FF66' : '#FF6666';

    const feedback = this.add.text(x, y - 80, text, {
      fontSize: '48px',
      color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    feedback.setOrigin(0.5);

    this.tweens.add({
      targets: feedback,
      y: y - 130,
      alpha: 0,
      duration: 500,
      onComplete: () => feedback.destroy(),
    });
  }

  private moveLane(direction: number): void {
    const nextIndex = Phaser.Math.Clamp(this.currentLaneIndex + direction, 0, this.laneYs.length - 1);
    if (nextIndex === this.currentLaneIndex) return;
    this.currentLaneIndex = nextIndex;
    this.tweens.add({
      targets: this.boat,
      y: this.laneYs[this.currentLaneIndex],
      duration: 150,
      ease: 'Sine.easeOut',
    });
  }

}
