import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../config';
import { TUNING } from '../../constants/tuning';

interface Gate {
  container: Phaser.GameObjects.Container;
  passed: boolean;
  gateX: number;
}

export class SailBetweenLights extends BaseMinigame {
  private boat!: Phaser.GameObjects.Container;
  private gates: Gate[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;
  private gatesPassed: number = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

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
    this.cursors = this.input.keyboard?.createCursorKeys();

    // Instructions
    const instructions = this.add.text(GAME_WIDTH / 2, 100, 'Use Arrow Keys to steer through the gates!', {
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
  }

  private createBoat(): void {
    const x = 200;
    const y = GAME_HEIGHT / 2 + 100;

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
      callback: () => this.spawnGate(),
      loop: true,
    });

    // Spawn initial gate
    this.time.delayedCall(500, () => this.spawnGate());
  }

  private spawnGate(): void {
    if (this.isGameOver) return;

    const config = TUNING.sailing;

    // Random Y position for gate
    const gateY = GAME_HEIGHT / 2 + Phaser.Math.Between(-50, 150);
    const gateWidth = config.gateWidth;

    const container = this.add.container(GAME_WIDTH + 100, gateY);

    // Left pole with light
    const leftPole = this.add.rectangle(-gateWidth / 2, 0, 10, 100, 0x8B4513);
    const leftLight = this.add.circle(-gateWidth / 2, -40, 15, COLORS.gold);
    this.tweens.add({
      targets: leftLight,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Right pole with light
    const rightPole = this.add.rectangle(gateWidth / 2, 0, 10, 100, 0x8B4513);
    const rightLight = this.add.circle(gateWidth / 2, -40, 15, COLORS.gold);
    this.tweens.add({
      targets: rightLight,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      delay: 250,
    });

    // Add a visible gate ring / pass area indicator between lights
    const ring = this.add.circle(0, -40, gateWidth / 2 + 20, 0xFFFFFF, 0);
    ring.setStrokeStyle(4, 0x66ccff, 0.6);
    this.tweens.add({
      targets: ring,
      alpha: 0.15,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    container.add([leftPole, rightPole, leftLight, rightLight, ring]);

    container.add([leftPole, rightPole, leftLight, rightLight]);

    this.gates.push({
      container,
      passed: false,
      gateX: gateWidth / 2,
    });
  }

  update(): void {
    if (this.isGameOver) return;

    const config = TUNING.sailing;
    const delta = this.game.loop.delta / 1000;

    // Boat steering
    if (this.cursors?.up?.isDown) {
      this.boat.y -= config.steerSpeed * delta;
    }
    if (this.cursors?.down?.isDown) {
      this.boat.y += config.steerSpeed * delta;
    }
    if (this.cursors?.left?.isDown) {
      this.boat.x -= config.steerSpeed * delta * 0.5;
    }
    if (this.cursors?.right?.isDown) {
      this.boat.x += config.steerSpeed * delta * 0.5;
    }

    // Clamp boat position
    this.boat.y = Phaser.Math.Clamp(this.boat.y, 150, GAME_HEIGHT - 50);
    this.boat.x = Phaser.Math.Clamp(this.boat.x, 100, 400);

    // Move gates
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const gate = this.gates[i];
      gate.container.x -= config.boatSpeed * delta;

      // Check if boat passed through gate
      if (!gate.passed) {
        const boatY = this.boat.y;
        const gateY = gate.container.y;
        const dx = Math.abs(this.boat.x - gate.container.x);

        // if boat close enough to gate X and vertically aligned, count as pass
        if (dx < 80 && Math.abs(boatY - gateY) < 80) {
          gate.passed = true;
          this.gatesPassed++;
          this.hud.setScore(this.gatesPassed);
          this.showGateFeedback(gate.container.x, gate.container.y, true);

          // Check for win
          if (this.gatesPassed >= config.targetGates) {
            this.spawnTimer?.destroy();
            this.showWin();
          }
        }
      }

      // Check for collision/miss
      if (!gate.passed && gate.container.x < this.boat.x - 60) {
        gate.passed = true;
        this.showGateFeedback(gate.container.x, gate.container.y, false);
      }

      // Remove if off screen
      if (gate.container.x < -150) {
        gate.container.destroy();
        this.gates.splice(i, 1);
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

}
