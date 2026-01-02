export interface GameState {
  currentLevelIndex: number;
  completedLevels: boolean[];
  tokensCollected: string[];
  lossCount: Record<number, number>;
  firstPlayComplete: boolean;
}

const STORAGE_KEY = 'cinnamo-go-save';

const DEFAULT_STATE: GameState = {
  currentLevelIndex: 0,
  completedLevels: [false, false, false, false, false, false],
  tokensCollected: [],
  lossCount: {},
  firstPlayComplete: false,
};

export class SaveManager {
  private static instance: SaveManager;
  private state: GameState;

  private constructor() {
    this.state = this.load();
  }

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  private load(): GameState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load save state:', e);
    }
    return { ...DEFAULT_STATE };
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  getState(): GameState {
    return this.state;
  }

  getCurrentLevelIndex(): number {
    return this.state.currentLevelIndex;
  }

  completeLevel(levelIndex: number, tokenId: string): void {
    this.state.completedLevels[levelIndex] = true;
    if (!this.state.tokensCollected.includes(tokenId)) {
      this.state.tokensCollected.push(tokenId);
    }
    if (levelIndex + 1 > this.state.currentLevelIndex) {
      this.state.currentLevelIndex = levelIndex + 1;
    }
    if (levelIndex === 5) {
      this.state.firstPlayComplete = true;
    }
    this.save();
  }

  recordLoss(levelIndex: number): void {
    this.state.lossCount[levelIndex] = (this.state.lossCount[levelIndex] || 0) + 1;
    this.save();
  }

  getLossCount(levelIndex: number): number {
    return this.state.lossCount[levelIndex] || 0;
  }

  isLevelCompleted(levelIndex: number): boolean {
    return this.state.completedLevels[levelIndex];
  }

  isLevelUnlocked(levelIndex: number): boolean {
    if (levelIndex === 0) return true;
    return this.state.completedLevels[levelIndex - 1];
  }

  getTokensCollected(): string[] {
    return this.state.tokensCollected;
  }

  reset(): void {
    this.state = { ...DEFAULT_STATE };
    this.save();
  }
}
