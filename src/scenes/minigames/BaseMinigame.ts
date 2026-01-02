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
    this.scene.start('MapScene');
  }

  protected createBackground(color: number = 0x87CEEB): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color);
  }
}
