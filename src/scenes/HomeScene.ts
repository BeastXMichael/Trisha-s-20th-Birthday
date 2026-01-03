import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class HomeScene extends Phaser.Scene {
  private video!: Phaser.GameObjects.Video;
  private transitionOverlay!: Phaser.GameObjects.Rectangle;
  private homeMusic?: Phaser.Sound.BaseSound;
  private onSoundUnlocked?: () => void;

  constructor() {
    super({ key: 'HomeScene' });
  }

  preload(): void {
    // Load video
    this.load.video('introVideo', 'assets/video/intro.mp4');
    // Load the game map
    this.load.image('gameMap', 'assets/gameMap.jpg');
    // Load the character
    this.load.image('character', 'assets/character/character.png');
    // Load Judy Hopps for dialogue system using import URL (Vite-friendly)
    this.load.image('judy', new URL('../Assets/5c52bb54bb7e2a029589d29a.png', import.meta.url).href);

    // Load audio files
    this.load.audio('homeMusic', new URL('../Assets/CinnamoLand!.mp3', import.meta.url).href);
    this.load.audio('buttonClick', new URL('../Assets/this-is-a-fun-bright-jga5sh2q (1).wav', import.meta.url).href);
    this.load.audio('mapMusic', new URL('../Assets/CinnaZoo Stroll.mp3', import.meta.url).href);
    this.load.audio('dialogueSound', new URL('../Assets/dialogue-sound-effect-made-with-Voicemod.mp3', import.meta.url).href);
    this.load.audio('gameMusic', new URL('../Assets/Cloudtrack Arcade.mp3', import.meta.url).href);
    this.load.audio('victorySound', new URL('../Assets/11l-victory-1749704552668-358772 (1).mp3', import.meta.url).href);
    this.load.audio('loseSound', new URL('../Assets/Lose sound effects.mp3', import.meta.url).href);
    this.load.audio('gameStartSound', new URL('../Assets/Game Start Sound Effect- Arcade games.mp3', import.meta.url).href);
    this.load.audio('finalVictoryMusic', new URL('../Assets/Mario Victory Theme [yjTZLVFi4aA].mp3', import.meta.url).href);

    // Token logos
    this.load.image('tokenCar', new URL('../Assets/Logos/Car Logo.png', import.meta.url).href);
    this.load.image('tokenMexico', new URL('../Assets/Logos/Mexico logo.png', import.meta.url).href);
    this.load.image('tokenMatcha', new URL('../Assets/Logos/Matcha Logo.png', import.meta.url).href);
    this.load.image('tokenSailing', new URL('../Assets/Logos/Sailing Logo.png', import.meta.url).href);
    this.load.image('tokenSunset', new URL('../Assets/Logos/Sunset Logo.png', import.meta.url).href);
    this.load.image('tokenDinner', new URL('../Assets/Logos/Dinner Logo.png', import.meta.url).href);
  }

  create(): void {
    // Black background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000);

    // Add video centered
    this.video = this.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'introVideo');

    // Mute the video
    this.video.setMute(true);

    // Play video on loop - scale after it starts playing when dimensions are known
    this.video.play(true);

    // Wait for video to have dimensions, then scale to fit entirely
    this.video.once('play', () => {
      if (this.video.width > 0 && this.video.height > 0) {
        const scaleX = GAME_WIDTH / this.video.width;
        const scaleY = GAME_HEIGHT / this.video.height;
        const scale = Math.min(scaleX, scaleY);
        this.video.setScale(scale);
      }
    });

    // Start home music immediately (or as soon as audio unlocks)
    const startHomeMusic = () => {
      if (!this.homeMusic) {
        this.homeMusic = this.sound.add('homeMusic', { loop: true, volume: 0.7 });
      }
      if (!this.homeMusic.isPlaying) {
        this.homeMusic.play();
      }
    };

    if (this.sound.locked) {
      this.onSoundUnlocked = startHomeMusic;
      this.sound.once('unlocked', this.onSoundUnlocked);
    } else {
      startHomeMusic();
    }

    // Make the ENTIRE screen clickable (click anywhere to proceed)
    const fullScreenButton = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.001 // Nearly invisible but still interactive
    );
    fullScreenButton.setInteractive({ useHandCursor: true });
    fullScreenButton.setDepth(50);

    fullScreenButton.on('pointerdown', () => {
      this.startTransition();
    });

    // Create white transition overlay (initially invisible)
    this.transitionOverlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0xFFFFFF,
      0
    );
    this.transitionOverlay.setDepth(100);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.onSoundUnlocked) {
        this.sound.off('unlocked', this.onSoundUnlocked);
        this.onSoundUnlocked = undefined;
      }
      if (this.homeMusic) {
        this.homeMusic.stop();
        this.homeMusic.destroy();
        this.homeMusic = undefined;
      }
    });
  }

  private startTransition(): void {
    if (this.onSoundUnlocked) {
      this.sound.off('unlocked', this.onSoundUnlocked);
      this.onSoundUnlocked = undefined;
    }
    // Stop home music and play button click sound
    if (this.homeMusic) {
      this.homeMusic.stop();
    }
    this.sound.stopByKey('homeMusic');
    this.sound.play('buttonClick');

    // Stop video
    this.video.stop();

    // Light flash transition
    this.tweens.add({
      targets: this.transitionOverlay,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.scene.start('MapScene');
      },
    });

    // Subtle zoom effect
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.1,
      duration: 400,
      ease: 'Power2',
    });
  }
}
