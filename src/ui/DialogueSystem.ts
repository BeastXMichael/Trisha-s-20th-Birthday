import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/**
 * Undertale-style Dialogue System
 * - Character sprite on the right side
 * - Dialogue box at the bottom
 * - Typewriter effect
 * - ENTER to advance
 */
export class DialogueSystem {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private dialogueBox!: Phaser.GameObjects.Rectangle;
  private dialogueBoxBorder!: Phaser.GameObjects.Rectangle;
  private dialogueText!: Phaser.GameObjects.Text;
  private characterSprite!: Phaser.GameObjects.Image;
  private continueIndicator!: Phaser.GameObjects.Text;
  private nameTag!: Phaser.GameObjects.Container;
  private nameText!: Phaser.GameObjects.Text;

  private dialogueLines: string[] = [];
  private currentLineIndex: number = 0;
  private currentCharIndex: number = 0;
  private isTyping: boolean = false;
  private typewriterTimer?: Phaser.Time.TimerEvent;

  private onCompleteCallback?: () => void;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private ignoreInputUntil: number = 0;

  // Dialogue sound effect
  private dialogueSound?: Phaser.Sound.BaseSound;

  // Typewriter speed (ms per character)
  private readonly TYPEWRITER_SPEED = 30;

  // UI dimensions
  private readonly BOX_WIDTH = GAME_WIDTH - 60;
  // Reduced to 75% of previous height (160 * 0.75 = 120)
  private readonly BOX_HEIGHT = 120;
  private BOX_Y: number = 0;
  private readonly BOX_PADDING = 24;

  public isActive: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
    this.setupInput();
  }

  private createUI(): void {
    // Create container to hold all dialogue elements
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setVisible(false);

    // Anchor the dialogue box to the bottom of the game area
    this.BOX_Y = GAME_HEIGHT - this.BOX_HEIGHT / 2 - 8;

    // Soft dreamy background with subtle border and glow
    this.dialogueBoxBorder = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      this.BOX_Y,
      this.BOX_WIDTH + 12,
      this.BOX_HEIGHT + 12,
      0xFFFFFF,
      0.9
    );

    this.dialogueBox = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      this.BOX_Y,
      this.BOX_WIDTH,
      this.BOX_HEIGHT,
      0xFFF8FF
    );

    // Add a soft glow behind the box using another translucent rectangle
    const glow = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      this.BOX_Y,
      this.BOX_WIDTH + 40,
      this.BOX_HEIGHT + 40,
      0xE8E0FF,
      0.12
    );

    // Character sprite (Judy Hopps) - positioned above/right of the dialogue box
    this.characterSprite = this.scene.add.image(
      GAME_WIDTH - 120,
      this.BOX_Y - this.BOX_HEIGHT / 2 - 2,
      'judy'
    );
    this.characterSprite.setOrigin(0.5, 1);
    this.characterSprite.setScale(0.35);

    // Name tag
    // Name tag - styled to match the dialogue box and bold
    const nameTagX = GAME_WIDTH / 2 - this.BOX_WIDTH / 2 + this.BOX_PADDING + 70;
    this.nameTag = this.scene.add.container(nameTagX, this.BOX_Y - this.BOX_HEIGHT / 2 - 18);
    const nameTagBg = this.scene.add.rectangle(0, 0, 140, 34, 0xFFF8FF, 1);
    nameTagBg.setStrokeStyle(3, 0xFFD1EA);
    this.nameText = this.scene.add.text(0, 0, 'Judy', {
      fontSize: '20px',
      color: '#333333',
      fontFamily: 'Georgia, Trebuchet MS, Arial, sans-serif',
      fontStyle: 'bold',
    });
    this.nameText.setOrigin(0.5);
    this.nameTag.add([nameTagBg, this.nameText]);

    // Dialogue text
    this.dialogueText = this.scene.add.text(
      GAME_WIDTH / 2 - this.BOX_WIDTH / 2 + this.BOX_PADDING,
      this.BOX_Y - this.BOX_HEIGHT / 2 + this.BOX_PADDING,
      '',
      {
        fontSize: '24px',
        color: '#333333',
        fontFamily: 'Georgia, Trebuchet MS, Arial, sans-serif',
        // Wrap to the space between left padding and the ENTER indicator area
        wordWrap: { width: this.BOX_WIDTH - this.BOX_PADDING * 2 - 20 },
        lineSpacing: 6,
      }
    );
    this.dialogueText.setOrigin(0, 0);

    // Continue indicator (blinking arrow/text)
    this.continueIndicator = this.scene.add.text(
      GAME_WIDTH / 2 + this.BOX_WIDTH / 2 - this.BOX_PADDING - 20,
      this.BOX_Y + this.BOX_HEIGHT / 2 - this.BOX_PADDING,
      '[ENTER]',
      {
        fontSize: '16px',
        color: '#FFCC00',
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    this.continueIndicator.setOrigin(0.5);
    this.continueIndicator.setVisible(false);

    // Add blinking animation to continue indicator
    this.scene.tweens.add({
      targets: this.continueIndicator,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Add all elements to container
    this.container.add([
      glow,
      this.dialogueBoxBorder,
      this.dialogueBox,
      this.nameTag,
      this.dialogueText,
      this.continueIndicator,
      this.characterSprite,
    ]);
  }

  private setupInput(): void {
    this.enterKey = this.scene.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );
    this.spaceKey = this.scene.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Also allow click/tap to advance
    this.scene.input.on('pointerdown', () => {
      if (this.isActive && this.canAdvance()) {
        this.advanceDialogue();
      }
    });
  }

  /**
   * Start a dialogue sequence
   * @param lines Array of dialogue strings
   * @param characterName Name to display (default: "Judy")
   * @returns Promise that resolves when dialogue is complete
   */
  public startDialogue(
    lines: string[],
    characterName: string = 'Judy'
  ): Promise<void> {
    return new Promise((resolve) => {
      this.dialogueLines = lines;
      this.currentLineIndex = 0;
      this.currentCharIndex = 0;
      this.isActive = true;
      this.onCompleteCallback = resolve;
      this.ignoreInputUntil = this.scene.time.now + 200;

      // Update name tag
      this.nameText.setText(characterName);

      // Show the dialogue UI
      this.container.setVisible(true);

      // Start with character entrance animation
      this.characterSprite.setAlpha(0);
      this.characterSprite.x = GAME_WIDTH + 100;

      this.scene.tweens.add({
        targets: this.characterSprite,
        x: GAME_WIDTH - 120,
        alpha: 1,
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Start first line after entrance
          this.showCurrentLine();
        },
      });

      // Fade in dialogue box
      this.dialogueBox.setAlpha(0);
      this.dialogueBoxBorder.setAlpha(0);
      this.nameTag.setAlpha(0);

      this.scene.tweens.add({
        targets: [this.dialogueBox, this.dialogueBoxBorder, this.nameTag],
        alpha: 1,
        duration: 300,
      });
    });
  }

  private showCurrentLine(): void {
    if (this.currentLineIndex >= this.dialogueLines.length) {
      this.endDialogue();
      return;
    }

    this.currentCharIndex = 0;
    this.dialogueText.setText('');
    this.continueIndicator.setVisible(false);
    this.isTyping = true;

    // Start dialogue sound effect (looping while typing)
    if (!this.dialogueSound) {
      this.dialogueSound = this.scene.sound.add('dialogueSound', { loop: true, volume: 0.65 });
    }
    this.dialogueSound.play();

    // Start typewriter effect
    this.typeNextCharacter();
  }

  private typeNextCharacter(): void {
    const currentLine = this.dialogueLines[this.currentLineIndex];

    if (this.currentCharIndex < currentLine.length) {
      this.dialogueText.setText(currentLine.substring(0, this.currentCharIndex + 1));
      this.currentCharIndex++;

      this.typewriterTimer = this.scene.time.delayedCall(
        this.TYPEWRITER_SPEED,
        () => this.typeNextCharacter()
      );
    } else {
      // Line complete - stop dialogue sound
      if (this.dialogueSound) {
        this.dialogueSound.stop();
      }
      this.isTyping = false;
      this.continueIndicator.setVisible(true);
    }
  }

  private advanceDialogue(): void {
    if (!this.isActive) return;

    if (this.isTyping) {
      // Skip typewriter effect - show full line immediately
      if (this.typewriterTimer) {
        this.typewriterTimer.destroy();
      }
      // Stop dialogue sound when skipping
      if (this.dialogueSound) {
        this.dialogueSound.stop();
      }
      const currentLine = this.dialogueLines[this.currentLineIndex];
      this.dialogueText.setText(currentLine);
      this.isTyping = false;
      this.continueIndicator.setVisible(true);
    } else {
      // Move to next line
      this.currentLineIndex++;
      this.showCurrentLine();
    }
  }

  private endDialogue(): void {
    // Stop dialogue sound if playing
    if (this.dialogueSound) {
      this.dialogueSound.stop();
    }
    this.scene.sound.stopByKey('dialogueSound');
    this.scene.sound.stopByKey('dialogueSound');

    // Exit animation for character
    this.scene.tweens.add({
      targets: this.characterSprite,
      x: GAME_WIDTH + 100,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeIn',
    });

    // Fade out dialogue box
    this.scene.tweens.add({
      targets: [this.dialogueBox, this.dialogueBoxBorder, this.nameTag, this.dialogueText, this.continueIndicator],
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.container.setVisible(false);
        this.isActive = false;

        // Reset positions for next time
        this.dialogueBox.setAlpha(1);
        this.dialogueBoxBorder.setAlpha(1);
        this.nameTag.setAlpha(1);
        this.dialogueText.setAlpha(1);
        this.continueIndicator.setAlpha(1);

        // Call completion callback
        if (this.onCompleteCallback) {
          this.onCompleteCallback();
        }
      },
    });
  }

  /**
   * Update method - call this in scene's update loop
   */
  public update(): void {
    if (!this.isActive) return;

    // Check for ENTER key press
    if (
      (Phaser.Input.Keyboard.JustDown(this.enterKey!) || Phaser.Input.Keyboard.JustDown(this.spaceKey!)) &&
      this.canAdvance()
    ) {
      this.advanceDialogue();
    }
  }

  private canAdvance(): boolean {
    return this.scene.time.now >= this.ignoreInputUntil;
  }

  /**
   * Clean up the dialogue system
   */
  public destroy(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    if (this.dialogueSound) {
      this.dialogueSound.stop();
      this.dialogueSound.destroy();
    }
    this.scene.sound.stopByKey('dialogueSound');
    this.container.destroy();
  }
}
