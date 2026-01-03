import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SaveManager } from '../systems/SaveManager';
import { pathGraph } from '../systems/PathGraph';
import { DialogueSystem } from '../ui/DialogueSystem';
import { DIALOGUES } from '../constants/dialogues';

/**
 * MapScene - Node-based navigation strictly constrained to the yellow path
 *
 * CONSTRAINTS:
 * - Character can ONLY stand on the 11 yellow circles
 * - Character can ONLY move along the yellow lines
 * - Character's feet (bottom-center anchor) touch the path
 * - Y-coordinate determines render depth (depth sorting)
 */
export class MapScene extends Phaser.Scene {
  private saveManager!: SaveManager;
  private character!: Phaser.GameObjects.Image;
  private currentNodeId: string = '';
  private isWalking: boolean = false;

  // Dialogue system
  private dialogueSystem!: DialogueSystem;
  private static introShown: boolean = false;

  // Background music
  private mapMusic?: Phaser.Sound.BaseSound;

  // Keyboard controls
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyEnter?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;

  // Queue for multi-node walking
  private walkQueue: string[] = [];

  // Path order for keyboard navigation
  private readonly PATH_ORDER: string[] = [
    'start', 'supercar', 'mexican', 'path_curve', 'matcha',
    'sailing', 'path_terrace', 'sunset', 'mountain', 'finish'
  ];

  // Movement speed (pixels per second) - faster!
  private readonly WALK_SPEED = 350;

  constructor() {
    super({ key: 'MapScene' });
  }

  init(data: { lastLevelIndex?: number }): void {
    if (data && typeof data.lastLevelIndex === 'number') {
      const nodes = pathGraph.getAllNodes();
      const found = nodes.find(n => n.levelIndex === data.lastLevelIndex);
      if (found) {
        this.currentNodeId = found.id;
      }
    }
  }

  create(): void {
    this.saveManager = SaveManager.getInstance();

    // Add the game map as background
    const mapBg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'gameMap');
    const scaleX = GAME_WIDTH / mapBg.width;
    const scaleY = GAME_HEIGHT / mapBg.height;
    const scale = Math.max(scaleX, scaleY);
    mapBg.setScale(scale);
    mapBg.setDepth(0);

    // Create invisible hitboxes for each node (11 yellow circles)
    this.createNodeHitboxes();

    // Create the character with bottom-center anchor
    this.createCharacter();

    // Determine starting node: prefer init-provided node, otherwise default to 'start'
    if (!this.currentNodeId) {
      this.currentNodeId = 'start';
    }
    this.snapToNode(this.currentNodeId);

    // Fade in
    const fadeOverlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0xffffff,
      1
    );
    fadeOverlay.setDepth(1000);

    this.tweens.add({
      targets: fadeOverlay,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => fadeOverlay.destroy(),
    });

    // Start idle animation
    this.startIdleAnimation();

    // Setup keyboard controls
    this.cursors = this.input.keyboard?.createCursorKeys();

    // Initialize dialogue system
    this.dialogueSystem = new DialogueSystem(this);
    this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyEnter = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Add guidance text
    this.addGuidanceText();

    // Ensure home music is stopped when entering the map
    this.sound.stopByKey('homeMusic');

    // Start map background music (avoid stacking)
    const existingMapMusic = this.sound.get('mapMusic');
    if (existingMapMusic && existingMapMusic.isPlaying) {
      this.mapMusic = existingMapMusic;
    } else {
      this.sound.stopByKey('messageMusic');
      this.sound.stopByKey('finalVictoryMusic');
      this.sound.stopByKey('mapMusic');
      this.mapMusic = this.sound.add('mapMusic', { loop: true, volume: 0.6 });
      this.mapMusic.play();
    }

    // Show intro dialogue once when entering the map
    if (!MapScene.introShown) {
      MapScene.introShown = true;
      this.dialogueSystem.startDialogue(DIALOGUES.intro, 'Judy').then(() => {
        // dialogue finished
      });
    }
  }

  /**
   * Add guidance text for the user
   */
  private addGuidanceText(): void {
    const guidanceText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30,
      'Click any location to move | Click again on a level to play | Use A/D or Arrow Keys to navigate', {
      fontSize: '14px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#00000088',
      padding: { x: 15, y: 8 },
    });
    guidanceText.setOrigin(0.5);
    guidanceText.setDepth(200);
  }

  update(): void {
    // Pause map input while dialogue is active
    if (this.dialogueSystem && this.dialogueSystem.isActive) return;

    if (this.isWalking) return;

    // Check keyboard input for navigation
    if (Phaser.Input.Keyboard.JustDown(this.cursors?.left!) || Phaser.Input.Keyboard.JustDown(this.keyA!)) {
      this.moveToAdjacentInOrder(-1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors?.right!) || Phaser.Input.Keyboard.JustDown(this.keyD!)) {
      this.moveToAdjacentInOrder(1);
    }

    // Update dialogue system to handle ENTER advances
    if (this.dialogueSystem) {
      this.dialogueSystem.update();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyEnter!) || Phaser.Input.Keyboard.JustDown(this.keySpace!)) {
      this.handleNodeAction(this.currentNodeId);
    }
  }

  /**
   * Move to the next or previous node in the defined PATH_ORDER
   */
  private moveToAdjacentInOrder(direction: number): void {
    const currentIndex = this.PATH_ORDER.indexOf(this.currentNodeId);
    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= this.PATH_ORDER.length) return;

    const targetNodeId = this.PATH_ORDER[newIndex];
    this.walkToNode(targetNodeId);
  }

  /**
   * Get starting node based on save progress
   */
  private getSavedNodeId(): string {
    const nodes = pathGraph.getAllNodes();

    for (const node of nodes) {
      if (node.levelIndex >= 0 && node.levelIndex <= 5) {
        if (!this.saveManager.isLevelCompleted(node.levelIndex)) {
          return node.id;
        }
      }
    }

    return 'finish';
  }

  /**
   * Create character using the custom image
   * Uses BOTTOM-CENTER anchor point so feet touch the path
   */
  private createCharacter(): void {
    this.character = this.add.image(0, 0, 'character');
    this.character.setOrigin(0.5, 1); // Bottom-center anchor (feet at position)
    this.character.setScale(0.05); // Scale down the large image (1/3 of previous)
  }

  /**
   * Snap character to a node - feet touch the yellow circle
   * Also updates depth based on Y position
   */
  private snapToNode(nodeId: string): void {
    const node = pathGraph.getNode(nodeId);
    if (!node) return;

    // Position character so feet are at node position
    this.character.setPosition(node.x, node.y);

    // Update depth based on Y (higher Y = rendered on top)
    this.updateCharacterDepth(node.y);
  }

  /**
   * Update character depth based on Y coordinate
   * Characters at bottom of screen (higher Y) render in front
   */
  private updateCharacterDepth(y: number): void {
    // Depth range: 10-100 based on Y position (0-720)
    const depth = 10 + (y / GAME_HEIGHT) * 90;
    this.character.setDepth(depth);
  }

  /**
   * Create invisible hitboxes for the 11 yellow circle nodes
   */
  private createNodeHitboxes(): void {
    const nodes = pathGraph.getAllNodes();

    nodes.forEach((node) => {
      const hitbox = this.add.circle(node.x, node.y, 25, 0xffff00, 0);
      hitbox.setInteractive({ useHandCursor: true });
      hitbox.setDepth(5);

      hitbox.on('pointerdown', () => {
        this.onNodeClicked(node.id);
      });

      hitbox.on('pointerover', () => {
        if (!this.isWalking) {
          hitbox.setFillStyle(0xffff00, 0.25);
        }
      });

      hitbox.on('pointerout', () => {
        hitbox.setFillStyle(0xffff00, 0);
      });
    });
  }

  private onNodeClicked(targetNodeId: string): void {
    if (this.isWalking) return;

    this.sound.play('nodeSelectSound');

    if (targetNodeId === this.currentNodeId) {
      this.handleNodeAction(targetNodeId);
      return;
    }

    // Find path from current node to target node using PATH_ORDER
    const currentIndex = this.PATH_ORDER.indexOf(this.currentNodeId);
    const targetIndex = this.PATH_ORDER.indexOf(targetNodeId);

    if (currentIndex === -1 || targetIndex === -1) return;

    // Build the path of nodes to walk through
    const nodesToWalk: string[] = [];
    if (targetIndex > currentIndex) {
      // Moving forward
      for (let i = currentIndex + 1; i <= targetIndex; i++) {
        nodesToWalk.push(this.PATH_ORDER[i]);
      }
    } else {
      // Moving backward
      for (let i = currentIndex - 1; i >= targetIndex; i--) {
        nodesToWalk.push(this.PATH_ORDER[i]);
      }
    }

    if (nodesToWalk.length > 0) {
      this.walkQueue = nodesToWalk;
      this.walkToNextInQueue();
    }
  }

  /**
   * Walk to the next node in the queue
   */
  private walkToNextInQueue(): void {
    if (this.walkQueue.length === 0) return;

    const nextNodeId = this.walkQueue.shift()!;
    this.walkToNode(nextNodeId);
  }

  /**
   * Walk to an adjacent node following the curved yellow line
   */
  private walkToNode(targetNodeId: string): void {
    this.isWalking = true;

    // Stop idle animation
    this.tweens.killTweensOf(this.character);

    // Get the edge and interpolated path points
    const edge = pathGraph.getEdgeBetween(this.currentNodeId, targetNodeId);
    if (!edge) {
      this.isWalking = false;
      this.startIdleAnimation();
      return;
    }

    // Get smooth path points along the yellow line
    const pathPoints = pathGraph.getInterpolatedPath(edge, 40);
    if (pathPoints.length === 0) {
      this.isWalking = false;
      this.startIdleAnimation();
      return;
    }

    // Calculate path length for consistent speed
    const pathLength = pathGraph.getPathLength(pathPoints);
    const totalDuration = (pathLength / this.WALK_SPEED) * 1000;

    // Determine initial facing direction
    const targetNode = pathGraph.getNode(targetNodeId)!;
    const dx = targetNode.x - this.character.x;
    this.setFacingDirection(dx);

    // Start walking animation (feet moving)
    this.startWalkAnimation();

    // Animate along the path
    this.animateAlongPath(pathPoints, totalDuration, targetNodeId);
  }

  /**
   * Animate character along the interpolated path points
   */
  private animateAlongPath(
    pathPoints: { x: number; y: number }[],
    totalDuration: number,
    targetNodeId: string
  ): void {
    let currentIndex = 0;
    const segmentDuration = totalDuration / (pathPoints.length - 1);

    const moveToNextPoint = () => {
      if (currentIndex >= pathPoints.length - 1) {
        this.finishWalking(targetNodeId);
        return;
      }

      const currentPoint = pathPoints[currentIndex];
      const nextPoint = pathPoints[currentIndex + 1];

      // Update facing direction based on horizontal movement
      const dx = nextPoint.x - currentPoint.x;
      if (Math.abs(dx) > 1) {
        this.setFacingDirection(dx);
      }

      // Move to next point
      this.tweens.add({
        targets: this.character,
        x: nextPoint.x,
        y: nextPoint.y,
        duration: segmentDuration,
        ease: 'Linear',
        onUpdate: () => {
          // Update depth during movement based on current Y
          this.updateCharacterDepth(this.character.y);
        },
        onComplete: () => {
          currentIndex++;
          moveToNextPoint();
        },
      });
    };

    moveToNextPoint();
  }

  /**
   * Set character facing direction
   */
  private setFacingDirection(dx: number): void {
    this.character.setFlipX(dx < 0);
  }

  /**
   * Finish walking - snap to target node
   */
  private finishWalking(targetNodeId: string): void {
    this.currentNodeId = targetNodeId;

    // Snap exactly to node (ensures feet are centered on yellow circle)
    this.snapToNode(targetNodeId);

    // Check if there are more nodes in the queue
    if (this.walkQueue.length > 0) {
      // Continue to next node without stopping animation
      this.walkToNextInQueue();
      return;
    }

    // No more nodes to walk to - finish up
    this.isWalking = false;

    // Stop walk animation
    this.stopWalkAnimation();

    // Face right by default
    this.character.setFlipX(false);

    // Resume idle animation
    this.startIdleAnimation();
  }

  /**
   * Idle animation - gentle bounce
   */
  private startIdleAnimation(): void {
    this.tweens.killTweensOf(this.character);

    const baseY = this.character.y;

    this.tweens.add({
      targets: this.character,
      y: baseY - 3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Walking animation - static image, no animation needed
   */
  private startWalkAnimation(): void {
    // No animation needed for static image - character just moves
  }

  /**
   * Stop walking animation
   */
  private stopWalkAnimation(): void {
    // Kill any existing tweens on the character
    this.tweens.killTweensOf(this.character);
  }

  /**
   * Handle action when clicking on current node
   */
  private handleNodeAction(nodeId: string): void {
    const node = pathGraph.getNode(nodeId);
    if (!node) return;

    // Path nodes - no action
    if (node.levelIndex === -1) {
      return;
    }

    // Stop map music before any transition
    if (this.mapMusic) {
      this.mapMusic.stop();
    }

    // Finish node - go to chest scene
    if (node.levelIndex === 6) {
      this.scene.start('ChestScene');
      return;
    }

    // Level nodes (0-5) - go to ReadyScene (which will continue the music)
    const levelIndex = node.levelIndex;
    this.sound.play('enterGameSound');
    this.scene.start('ReadyScene', { levelIndex });
  }

}
