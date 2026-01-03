import Phaser from 'phaser';
import { HUD, HUDConfig } from '../../ui/HUD';
import { ResultScreen } from '../../ui/ResultScreen';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config';

export abstract class BaseMinigame extends Phaser.Scene {
  protected hud!: HUD;
  protected levelIndex: number = 0;
  protected isGameOver: boolean = false;
  protected timerEvent?: Phaser.Time.TimerEvent;
  protected gameMusic?: Phaser.Sound.BaseSound;

  init(data: { levelIndex: number }): void {
    this.levelIndex = data.levelIndex;
    this.isGameOver = false;

    // Setup ESC key to quit game
    this.input.keyboard?.on('keydown-ESC', () => {
      this.quitGame();
    });

    // Start game music with lower volume
    this.gameMusic = this.sound.add('gameMusic', { loop: true, volume: 0.35 });
    this.gameMusic.play();
  }

  /**
   * Quit the game and return to map
   */
  protected quitGame(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }
    if (this.gameMusic) {
      this.gameMusic.stop();
    }
    this.scene.start('MapScene');
  }

  protected setupHUD(config: HUDConfig): void {
    this.hud = new HUD(this, config);
    this.createSkipButton();
  }

  private createSkipButton(): void {
    const width = 90;
    const height = 36;
    const x = GAME_WIDTH - 70;
    const y = 40;

    const bg = this.add.rectangle(x, y, width, height, 0xFFFFFF, 0.9);
    bg.setStrokeStyle(2, 0x4A90A4);
    bg.setDepth(300);
    bg.setInteractive({ useHandCursor: true });

    const label = this.add.text(x, y, 'Skip', {
      fontSize: '18px',
      color: '#333333',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);
    label.setDepth(301);

    bg.on('pointerdown', () => {
      this.showWin();
    });
  }

  protected startTimer(seconds: number, onComplete: () => void): void {
    let remaining = seconds;
    this.hud.setTimer(remaining);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        remaining--;
        this.hud.setTimer(remaining);
        if (remaining <= 0) {
          onComplete();
        }
      },
      repeat: seconds - 1,
    });
  }

  protected showWin(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    // Stop game music and play victory sound
    if (this.gameMusic) {
      this.gameMusic.stop();
    }
    this.sound.play('victorySound', { volume: 0.7 });

    new ResultScreen(
      this,
      this.levelIndex,
      true,
      () => this.restartLevel(),
      () => this.goToMap()
    );
  }

  protected showLose(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    // Stop game music and play lose sound
    if (this.gameMusic) {
      this.gameMusic.stop();
    }
    this.sound.play('loseSound', { volume: 0.7 });

    new ResultScreen(
      this,
      this.levelIndex,
      false,
      () => this.restartLevel(),
      () => this.goToMap()
    );
  }

  protected restartLevel(): void {
    if (this.gameMusic) {
      this.gameMusic.stop();
    }
    this.scene.restart({ levelIndex: this.levelIndex });
  }

  protected goToMap(): void {
    if (this.gameMusic) {
      this.gameMusic.stop();
    }
    // Pass the last played level index so the map can place the character
    // on the node where the player just was instead of forcing a teleport.
    this.scene.start('MapScene', { lastLevelIndex: this.levelIndex });
  }

  protected createBackground(color: number = 0x87CEEB): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color);
  }
}
