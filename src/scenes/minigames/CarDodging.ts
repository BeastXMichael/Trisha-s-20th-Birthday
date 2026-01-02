import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../config';
import { TUNING } from '../../constants/tuning';

export class CarDodging extends BaseMinigame {
  private car!: Phaser.GameObjects.Container;
  private currentLane: number = 1; // 0, 1, 2 (left, center, right)
  private obstacles: Phaser.GameObjects.Container[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private canMove: boolean = true;

  // Progressive difficulty
  private gameStartTime: number = 0;
  private currentSpeedMultiplier: number = 1;
  private currentSpawnInterval: number = 0;

  constructor() {
    super({ key: 'CarDodging' });
  }

  create(): void {
    const config = TUNING.car;

    // Initialize progressive difficulty
    this.gameStartTime = this.time.now;
    this.currentSpeedMultiplier = 1;
    this.currentSpawnInterval = config.obstacleSpawnInterval;

    // Background - road
    this.createRoadBackground();

    // Setup HUD
    this.setupHUD({
      showHealth: true,
      maxHealth: config.startingHealth,
      showTimer: true,
      timerSeconds: config.gameDuration,
    });

    // Create player car
    this.createCar();

    // Setup controls
    this.setupControls();

    // Start spawning obstacles
    this.startSpawning();

    // Start timer
    this.startTimer(config.gameDuration, () => {
      // Time's up - player wins if still alive!
      this.showWin();
    });
  }

  private createRoadBackground(): void {
    const config = TUNING.car;

    // Sky
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 4, GAME_WIDTH, GAME_HEIGHT / 2, COLORS.skyBlue);

    // Road
    const roadWidth = config.lanes * config.laneWidth + 80;
    const roadX = GAME_WIDTH / 2;
    this.add.rectangle(roadX, GAME_HEIGHT / 2 + 100, roadWidth, GAME_HEIGHT, 0x444444);

    // Lane dividers
    for (let i = 0; i < config.lanes - 1; i++) {
      const laneX = this.getLaneX(i) + config.laneWidth / 2;
      for (let y = 100; y < GAME_HEIGHT; y += 60) {
        const dash = this.add.rectangle(laneX, y, 8, 30, 0xFFFFFF);
        // Animate dashes moving down
        this.tweens.add({
          targets: dash,
          y: dash.y + 60,
          duration: 500,
          repeat: -1,
        });
      }
    }

    // Side decorations
    this.add.rectangle(GAME_WIDTH / 2 - roadWidth / 2 - 50, GAME_HEIGHT / 2, 100, GAME_HEIGHT, COLORS.mint);
    this.add.rectangle(GAME_WIDTH / 2 + roadWidth / 2 + 50, GAME_HEIGHT / 2, 100, GAME_HEIGHT, COLORS.mint);
  }

  private getLaneX(lane: number): number {
    const config = TUNING.car;
    const roadCenter = GAME_WIDTH / 2;
    const roadWidth = config.lanes * config.laneWidth;
    const startX = roadCenter - roadWidth / 2 + config.laneWidth / 2;
    return startX + lane * config.laneWidth;
  }

  private createCar(): void {
    const x = this.getLaneX(this.currentLane);
    const y = GAME_HEIGHT - 120;

    this.car = this.add.container(x, y);

    // Car body
    const body = this.add.rectangle(0, 0, 60, 100, COLORS.lightBlue);
    body.setStrokeStyle(3, COLORS.darkBlue);

    // Car top
    const top = this.add.rectangle(0, -15, 40, 50, COLORS.skyBlue);
    top.setStrokeStyle(2, COLORS.darkBlue);

    // Wheels
    const wheel1 = this.add.rectangle(-25, -30, 15, 25, 0x333333);
    const wheel2 = this.add.rectangle(25, -30, 15, 25, 0x333333);
    const wheel3 = this.add.rectangle(-25, 30, 15, 25, 0x333333);
    const wheel4 = this.add.rectangle(25, 30, 15, 25, 0x333333);

    // Headlights
    const light1 = this.add.circle(-18, -45, 8, COLORS.gold);
    const light2 = this.add.circle(18, -45, 8, COLORS.gold);

    this.car.add([wheel1, wheel2, wheel3, wheel4, body, top, light1, light2]);
  }

  private setupControls(): void {
    // Keyboard controls
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Touch/click controls - tap left or right side of screen
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOver || !this.canMove) return;

      if (pointer.x < GAME_WIDTH / 2) {
        this.moveLane(-1);
      } else {
        this.moveLane(1);
      }
    });
  }

  private moveLane(direction: number): void {
    const config = TUNING.car;
    const newLane = Phaser.Math.Clamp(this.currentLane + direction, 0, config.lanes - 1);

    if (newLane !== this.currentLane) {
      this.currentLane = newLane;
      this.canMove = false;

      this.tweens.add({
        targets: this.car,
        x: this.getLaneX(this.currentLane),
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          this.canMove = true;
        },
      });
    }
  }

  private startSpawning(): void {
    this.scheduleNextSpawn();
  }

  /**
   * Schedule the next obstacle spawn with dynamic interval based on difficulty
   */
  private scheduleNextSpawn(): void {
    if (this.isGameOver) return;

    const config = TUNING.car;

    // Calculate time elapsed (in seconds)
    const elapsedSeconds = (this.time.now - this.gameStartTime) / 1000;

    // Decrease spawn interval over time (faster spawning)
    // Start at 1200ms, go down to 400ms minimum over 30 seconds
    const minInterval = 400;
    const intervalReduction = (config.obstacleSpawnInterval - minInterval) * (elapsedSeconds / config.gameDuration);
    this.currentSpawnInterval = Math.max(minInterval, config.obstacleSpawnInterval - intervalReduction);

    // Increase speed multiplier over time (1x to 2.5x over game duration)
    this.currentSpeedMultiplier = 1 + (elapsedSeconds / config.gameDuration) * 1.5;

    this.spawnTimer = this.time.addEvent({
      delay: this.currentSpawnInterval,
      callback: () => {
        this.spawnObstacle();
        this.scheduleNextSpawn();
      },
    });
  }

  private spawnObstacle(): void {
    if (this.isGameOver) return;

    const config = TUNING.car;

    // Random lane
    const lane = Phaser.Math.Between(0, config.lanes - 1);
    const x = this.getLaneX(lane);

    // Create obstacle container
    const obstacle = this.add.container(x, -50);

    // Random obstacle type
    const type = Phaser.Math.Between(0, 2);
    let obstacleGraphic: Phaser.GameObjects.GameObject;

    switch (type) {
      case 0: // Cone
        obstacleGraphic = this.add.polygon(0, 0, [0, -30, 20, 20, -20, 20], 0xFF6600);
        break;
      case 1: // Rock
        obstacleGraphic = this.add.circle(0, 0, 25, 0x888888);
        break;
      default: // Box
        obstacleGraphic = this.add.rectangle(0, 0, 50, 40, 0xCD853F);
    }

    obstacle.add(obstacleGraphic);
    this.obstacles.push(obstacle);
  }

  update(): void {
    if (this.isGameOver) return;

    // Check keyboard input
    if (this.canMove) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors?.left!) || Phaser.Input.Keyboard.JustDown(this.keyA!)) {
        this.moveLane(-1);
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors?.right!) || Phaser.Input.Keyboard.JustDown(this.keyD!)) {
        this.moveLane(1);
      }
    }

    // Move obstacles with progressive speed
    const config = TUNING.car;
    const speed = config.obstacleSpeed * this.currentSpeedMultiplier * (this.game.loop.delta / 1000);

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.y += speed;

      // Check collision
      if (this.checkCollision(obstacle)) {
        this.hitObstacle(obstacle, i);
        continue;
      }

      // Remove if off screen
      if (obstacle.y > GAME_HEIGHT + 50) {
        obstacle.destroy();
        this.obstacles.splice(i, 1);
      }
    }
  }

  private checkCollision(obstacle: Phaser.GameObjects.Container): boolean {
    const carBounds = new Phaser.Geom.Rectangle(
      this.car.x - 30,
      this.car.y - 50,
      60,
      100
    );

    const obstacleBounds = new Phaser.Geom.Rectangle(
      obstacle.x - 25,
      obstacle.y - 25,
      50,
      50
    );

    return Phaser.Geom.Rectangle.Overlaps(carBounds, obstacleBounds);
  }

  private hitObstacle(obstacle: Phaser.GameObjects.Container, index: number): void {
    // Remove obstacle
    obstacle.destroy();
    this.obstacles.splice(index, 1);

    // Reduce health
    const newHealth = this.hud.getHealth() - 1;
    this.hud.setHealth(newHealth);

    // Flash car red
    this.tweens.add({
      targets: this.car,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });

    // Check for game over
    if (newHealth <= 0) {
      this.spawnTimer?.destroy();
      this.showLose();
    }
  }

}
