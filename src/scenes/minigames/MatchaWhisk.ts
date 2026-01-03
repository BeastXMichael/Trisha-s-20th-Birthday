import Phaser from 'phaser';
import { BaseMinigame } from './BaseMinigame';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../config';
import { TUNING } from '../../constants/tuning';

export class MatchaWhisk extends BaseMinigame {
  private bowl!: Phaser.GameObjects.Container;
  private cursor!: Phaser.GameObjects.Container;
  private sweetSpot!: Phaser.GameObjects.Arc;
  private foamLevel: number = 0;
  private cursorAngle: number = 0;
  private sweetSpotAngle: number = 0;
  private startTime: number = 0;
  private baseSweetSpotArc: number = 0;
  private baseRotationSpeed: number = 0;
  private currentSweetSpotArc: number = 0;

  constructor() {
    super({ key: 'MatchaWhisk' });
  }

  create(): void {
    const config = TUNING.matcha;

    // Background - cozy cafe
    this.createCafeBackground();

    // Setup HUD
    this.setupHUD({
      showTimer: true,
      timerSeconds: config.gameDuration,
      showProgress: true,
      progressLabel: 'Foam:',
    });

    // Create bowl and whisk elements
    this.createBowl();

    // Setup controls
    this.setupControls();

    // Instructions
    const instructions = this.add.text(GAME_WIDTH / 2, 100, 'Press SPACE or Click when the cursor is in the green zone!', {
      fontSize: '22px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#00000088',
      padding: { x: 20, y: 10 },
    });
    instructions.setOrigin(0.5);

    // Start timer
    this.startTimer(config.gameDuration, () => {
      if (this.foamLevel >= config.targetFoam) {
        this.showWin();
      } else {
        this.showLose();
      }
    });

    this.startTime = this.time.now;
    this.baseSweetSpotArc = config.sweetSpotArc;
    this.baseRotationSpeed = config.rotationSpeed;
    this.currentSweetSpotArc = config.sweetSpotArc;
  }

  private createCafeBackground(): void {
    // Warm cafe colors
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xF5E6D3);

    // Table surface
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, GAME_WIDTH, 300, 0xDEB887);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, GAME_WIDTH, 20, 0xCD853F);

    // Decorative elements
    this.add.text(100, GAME_HEIGHT - 100, '🍵', { fontSize: '48px' });
    this.add.text(GAME_WIDTH - 150, GAME_HEIGHT - 100, '🍃', { fontSize: '48px' });
  }

  private createBowl(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2 + 80;
    const bowlRadius = 150;

    this.bowl = this.add.container(centerX, centerY);

    // Bowl outer
    const bowlOuter = this.add.circle(0, 0, bowlRadius, 0x8FBC8F);
    bowlOuter.setStrokeStyle(8, 0x556B2F);

    // Bowl inner (matcha color)
    const bowlInner = this.add.circle(0, 0, bowlRadius - 15, 0x9DC183);

    // Foam indicator (fills as you whisk)
    const foamCircle = this.add.circle(0, 0, bowlRadius - 20, 0xE8F5E9, 0);
    this.bowl.add([bowlOuter, bowlInner, foamCircle]);

    // Sweet spot arc (the target zone)
    const config = TUNING.matcha;
    const sweetSpotArcDegrees = this.currentSweetSpotArc || config.sweetSpotArc;
    // Use standard polar coordinates (0 rad = right) so cursor math and arc angles align
    this.sweetSpotAngle = Math.random() * Math.PI * 2;

    const startDeg = Phaser.Math.RadToDeg(this.sweetSpotAngle);
    this.sweetSpot = this.add.arc(
      0,
      0,
      bowlRadius + 30,
      startDeg,
      startDeg + sweetSpotArcDegrees,
      false,
      COLORS.mint
    );
    this.sweetSpot.setStrokeStyle(15, COLORS.mint);
    this.sweetSpot.setClosePath(false);
    this.bowl.add(this.sweetSpot);

    // Cursor (the whisk indicator)
    this.cursor = this.add.container(0, 0);
    const cursorHead = this.add.circle(0, 0, 20, COLORS.pink);
    cursorHead.setStrokeStyle(3, COLORS.coral);
    const cursorTail = this.add.rectangle(0, 15, 6, 20, 0x8B4513);
    this.cursor.add([cursorTail, cursorHead]);
    this.bowl.add(this.cursor);
    // Start cursor angle at top
    this.cursorAngle = -Math.PI / 2;
  }

  private setupControls(): void {
    // Spacebar
    this.input.keyboard?.on('keydown-SPACE', () => this.attemptWhisk());

    // Click/touch
    this.input.on('pointerdown', () => this.attemptWhisk());
  }

  private attemptWhisk(): void {
    if (this.isGameOver) return;

    const config = TUNING.matcha;

    // Check if cursor is in sweet spot
    // Compute cursor angle from actual cursor position for robust detection
    const cursorX = this.cursor.x;
    const cursorY = this.cursor.y;
    let cursorAngleFromPos = Math.atan2(cursorY, cursorX); // standard polar (0 = right)

    // Normalize to 0..2PI
    if (cursorAngleFromPos < 0) cursorAngleFromPos += Math.PI * 2;

    const sweetSpotStart = this.sweetSpotAngle % (Math.PI * 2);
    const sweetSpotEnd = (sweetSpotStart + Phaser.Math.DegToRad(this.currentSweetSpotArc)) % (Math.PI * 2);

    let inSweetSpot = false;
    if (sweetSpotEnd > sweetSpotStart) {
      inSweetSpot = cursorAngleFromPos >= sweetSpotStart && cursorAngleFromPos <= sweetSpotEnd;
    } else {
      // Wraps around
      inSweetSpot = cursorAngleFromPos >= sweetSpotStart || cursorAngleFromPos <= sweetSpotEnd;
    }

    if (inSweetSpot) {
      // Success!
      this.foamLevel = Math.min(this.foamLevel + config.foamPerHit, config.targetFoam);
      this.hud.setProgress(this.foamLevel, config.targetFoam);
      this.showWhiskFeedback(true);

      // Move sweet spot to new position
      this.sweetSpotAngle = Math.random() * Math.PI * 2;
      this.updateSweetSpot();

      // Check for win
      if (this.foamLevel >= config.targetFoam) {
        this.showWin();
      }
    } else {
      // Miss
      this.foamLevel = Math.max(this.foamLevel - config.foamLossPerMiss, 0);
      this.hud.setProgress(this.foamLevel, config.targetFoam);
      this.showWhiskFeedback(false);
    }
  }

  private updateSweetSpot(): void {
    const startDeg = Phaser.Math.RadToDeg(this.sweetSpotAngle);
    this.sweetSpot.setStartAngle(startDeg);
    this.sweetSpot.setEndAngle(startDeg + this.currentSweetSpotArc);
  }

  private showWhiskFeedback(success: boolean): void {
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT / 2 - 50;

    const text = success ? '✓ Nice!' : '✗';
    const color = success ? '#66FF66' : '#FF6666';

    const feedback = this.add.text(x, y, text, {
      fontSize: '36px',
      color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    feedback.setOrigin(0.5);

    this.tweens.add({
      targets: feedback,
      y: y - 50,
      alpha: 0,
      duration: 500,
      onComplete: () => feedback.destroy(),
    });

    // Visual pulse on bowl
    if (success) {
      this.tweens.add({
        targets: this.bowl,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        yoyo: true,
      });
    } else {
      this.tweens.add({
        targets: this.bowl,
        x: this.bowl.x - 10,
        duration: 50,
        yoyo: true,
        repeat: 2,
      });
    }
  }

  update(): void {
    if (this.isGameOver) return;

    const elapsedSeconds = (this.time.now - this.startTime) / 1000;
    const arcProgress = Math.min(elapsedSeconds / 15, 1);
    this.currentSweetSpotArc = this.baseSweetSpotArc * (1 - 0.5 * arcProgress);
    this.updateSweetSpot();

    const speedProgress = Math.min(elapsedSeconds / 20, 1);
    const rotationSpeed = this.baseRotationSpeed * (1 + speedProgress);
    // Rotate cursor (standard polar coordinates)
    this.cursorAngle += rotationSpeed * (this.game.loop.delta / 1000);

    // Update cursor position using cos/sin so 0 rad = right
    const radius = 180; // bowlRadius + 30
    this.cursor.x = Math.cos(this.cursorAngle) * radius;
    this.cursor.y = Math.sin(this.cursorAngle) * radius;
    this.cursor.setRotation(this.cursorAngle + Math.PI / 2);
  }
}
