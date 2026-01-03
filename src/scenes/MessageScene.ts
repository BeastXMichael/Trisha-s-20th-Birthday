import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MessageScene extends Phaser.Scene {
  private pages: string[] = [];
  private currentPageIndex = 0;
  private currentSentences: string[] = [];
  private currentSentenceIndex = 0;
  private displayedText = '';
  private baseText = '';
  private textObject!: Phaser.GameObjects.Text;
  private continueIndicator!: Phaser.GameObjects.Text;
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private isTyping = false;
  private currentCharIndex = 0;
  private ignoreInputUntil = 0;
  private music?: Phaser.Sound.BaseSound;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private awaitingChoice = false;
  private choiceContainer?: Phaser.GameObjects.Container;
  private dialogueSound?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'MessageScene' });
  }

  create(): void {
    this.cameras.main.fadeIn(400, 255, 255, 255);
    const mapBg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'gameMap');
    const mapScaleX = GAME_WIDTH / mapBg.width;
    const mapScaleY = GAME_HEIGHT / mapBg.height;
    const mapScale = Math.max(mapScaleX, mapScaleY);
    mapBg.setScale(mapScale);
    mapBg.setDepth(0);

    const dimmer = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);
    dimmer.setDepth(1);

    const frame = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'messageFrame');
    const frameScaleX = GAME_WIDTH / frame.width;
    const frameScaleY = GAME_HEIGHT / frame.height;
    const frameScale = Math.max(frameScaleX, frameScaleY);
    frame.setScale(frameScale);
    frame.setDepth(2);

    this.music = this.sound.add('messageMusic', { loop: true, volume: 0.7 });
    this.music.play();

    const paddingX = 230;
    const paddingTop = 200;
    const paddingBottom = 140;
    const textAreaWidth = GAME_WIDTH - paddingX * 2;
    const textAreaHeight = GAME_HEIGHT - paddingTop - paddingBottom;

    this.textObject = this.add.text(paddingX, paddingTop, '', {
      fontSize: '24px',
      color: '#4A3B3B',
      fontFamily: 'Georgia, "Times New Roman", serif',
      wordWrap: { width: textAreaWidth },
      lineSpacing: 8,
    });
    this.textObject.setOrigin(0, 0);
    this.textObject.setDepth(3);

    this.continueIndicator = this.add.text(
      GAME_WIDTH - paddingX,
      GAME_HEIGHT - paddingBottom + 20,
      '[SPACE / ENTER]',
      {
        fontSize: '16px',
        color: '#8A6A6A',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontStyle: 'bold',
      }
    );
    this.continueIndicator.setOrigin(1, 0.5);
    this.continueIndicator.setVisible(false);
    this.continueIndicator.setDepth(3);

    this.tweens.add({
      targets: this.continueIndicator,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.pages = this.buildPages(textAreaWidth, textAreaHeight);
    this.currentPageIndex = 0;
    this.ignoreInputUntil = this.time.now + 200;
    this.showPage();

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.input.on('pointerdown', () => {
      if (this.canAdvance()) {
        this.advance();
      }
    });
  }

  update(): void {
    if (!this.canAdvance() || this.awaitingChoice) return;
    if (
      (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) ||
      (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey))
    ) {
      this.advance();
    }
  }

  private buildPages(width: number, height: number): string[] {
    const raw = (this.cache.text.get('messageText') as string) || '';
    const paragraphs = raw
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const pages: string[] = [];
    let currentText = '';

    paragraphs.forEach((paragraph) => {
      const candidate = currentText ? `${currentText}\n\n${paragraph}` : paragraph;
      const candidateHeight = this.measureTextHeight(candidate, width);

      if (candidateHeight <= height || currentText.length === 0) {
        currentText = candidate;
      } else {
        pages.push(currentText);
        currentText = paragraph;
      }
    });

    if (currentText.length > 0) {
      pages.push(currentText);
    }

    return pages;
  }

  private measureTextHeight(text: string, width: number): number {
    const temp = this.add.text(0, 0, text, {
      fontSize: '24px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      wordWrap: { width },
      lineSpacing: 8,
    });
    temp.setVisible(false);
    const height = temp.getBounds().height;
    temp.destroy();
    return height;
  }

  private showPage(): void {
    this.currentSentences = this.splitIntoSentences(this.pages[this.currentPageIndex] || '');
    this.currentSentenceIndex = 0;
    this.displayedText = '';
    this.baseText = '';
    this.showSentence();
  }

  private showSentence(): void {
    this.baseText = this.displayedText;
    this.currentCharIndex = 0;
    this.isTyping = true;
    this.textObject.setText(this.displayedText);
    this.continueIndicator.setVisible(false);
    this.typeNextCharacter();
  }

  private typeNextCharacter(): void {
    const sentence = this.currentSentences[this.currentSentenceIndex] || '';
    const prefix = this.baseText.length > 0 && !sentence.startsWith('\n') ? ' ' : '';
    if (this.currentCharIndex < sentence.length) {
      this.textObject.setText(this.baseText + prefix + sentence.substring(0, this.currentCharIndex + 1));
      this.currentCharIndex++;
      if (!this.dialogueSound) {
        this.dialogueSound = this.sound.add('dialogueSound', { loop: true, volume: 0.65 });
      }
      if (!this.dialogueSound.isPlaying) {
        this.dialogueSound.play();
      }
      this.typewriterTimer = this.time.delayedCall(20, () => this.typeNextCharacter());
    } else {
      if (this.dialogueSound && this.dialogueSound.isPlaying) {
        this.dialogueSound.stop();
      }
      this.displayedText = this.baseText + prefix + sentence;
      this.isTyping = false;
      this.continueIndicator.setVisible(true);
    }
  }

  private advance(): void {
    if (this.awaitingChoice) return;
    if (this.isTyping) {
      if (this.typewriterTimer) {
        this.typewriterTimer.destroy();
      }
      if (this.dialogueSound && this.dialogueSound.isPlaying) {
        this.dialogueSound.stop();
      }
      const sentence = this.currentSentences[this.currentSentenceIndex] || '';
      const prefix = this.baseText.length > 0 && !sentence.startsWith('\n') ? ' ' : '';
      this.displayedText = this.baseText + prefix + sentence;
      this.textObject.setText(this.displayedText);
      this.isTyping = false;
      this.continueIndicator.setVisible(true);
      return;
    }

    if (this.currentSentenceIndex < this.currentSentences.length - 1) {
      this.currentSentenceIndex++;
      this.showSentence();
      return;
    }

    if (this.currentPageIndex < this.pages.length - 1) {
      this.currentPageIndex++;
      this.showPage();
      return;
    }

    this.showChoice();
  }

  private showChoice(): void {
    this.awaitingChoice = true;
    this.continueIndicator.setVisible(false);

    const y = GAME_HEIGHT - 140;
    this.choiceContainer = this.add.container(0, 0);

    const yesBg = this.add.rectangle(GAME_WIDTH / 2 - 80, y, 140, 46, 0xFFFFFF, 0.9);
    yesBg.setStrokeStyle(2, 0xD5B8B8);
    yesBg.setInteractive({ useHandCursor: true });
    const yesText = this.add.text(GAME_WIDTH / 2 - 80, y, 'Yes', {
      fontSize: '22px',
      color: '#4A3B3B',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontStyle: 'bold',
    });
    yesText.setOrigin(0.5);

    const noBg = this.add.rectangle(GAME_WIDTH / 2 + 80, y, 140, 46, 0xFFFFFF, 0.6);
    noBg.setStrokeStyle(2, 0xD5B8B8);
    noBg.setInteractive({ useHandCursor: true });
    const noText = this.add.text(GAME_WIDTH / 2 + 80, y, 'No', {
      fontSize: '22px',
      color: '#4A3B3B',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontStyle: 'bold',
    });
    noText.setOrigin(0.5);

    this.choiceContainer.add([yesBg, yesText, noBg, noText]);
    this.choiceContainer.setDepth(3);

    yesBg.on('pointerdown', () => {
      this.stopDialogueSound();
      this.scene.start('ChestScene', { resumeAfterMessage: true });
    });

    // "No" intentionally does nothing
  }

  private canAdvance(): boolean {
    return this.time.now >= this.ignoreInputUntil;
  }

  private splitIntoSentences(text: string): string[] {
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const sentences: string[] = [];
    paragraphs.forEach((paragraph, index) => {
      const normalized = paragraph.replace(/\s+/g, ' ').trim();
      const rawSentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
      const grouped: string[] = [];
      for (let i = 0; i < rawSentences.length; i += 2) {
        const first = rawSentences[i]?.trim() || '';
        const second = rawSentences[i + 1]?.trim() || '';
        const combined = second ? `${first} ${second}` : first;
        if (combined) {
          grouped.push(combined);
        }
      }

      grouped.forEach((sentence, sentenceIndex) => {
        const trimmed = sentence.trim();
        if (!trimmed) return;
        if (index > 0 && sentenceIndex === 0) {
          sentences.push(`\n\n${trimmed}`);
        } else {
          sentences.push(trimmed);
        }
      });
    });
    return sentences;
  }

  private stopDialogueSound(): void {
    if (this.dialogueSound) {
      this.dialogueSound.stop();
      this.dialogueSound.destroy();
      this.dialogueSound = undefined;
    }
    this.sound.stopByKey('dialogueSound');
  }
}
