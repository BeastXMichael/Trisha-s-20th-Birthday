# Cinnamo-Go Project Handoff

## Overview
A Phaser 3 game for Trisha's Birthday featuring a Cinnamoroll-themed adventure map with 6 mini-games.

## Tech Stack
- **Framework**: Phaser 3
- **Build Tool**: Vite
- **Language**: TypeScript
- **Port**: localhost:3001 (dev server)

## Project Structure
```
cinnamo-go/
├── public/
│   └── assets/
│       ├── gameMap.jpg          # Main map background image
│       └── video/
│           └── intro.mp4        # Intro video for HomeScene
├── src/
│   ├── main.ts                  # Entry point
│   ├── config.ts                # Game config, dimensions (1280x720), colors
│   ├── constants/
│   │   └── levels.ts            # Level definitions (6 levels)
│   ├── systems/
│   │   └── SaveManager.ts       # LocalStorage save system
│   ├── scenes/
│   │   ├── HomeScene.ts         # Intro video screen
│   │   ├── MapScene.ts          # Main map with walking character
│   │   ├── ReadyScene.ts        # Level preview before starting
│   │   ├── ChestScene.ts        # Final reward scene
│   │   └── minigames/
│   │       ├── BaseMinigame.ts
│   │       ├── CarDodging.ts    # Level 1
│   │       ├── FoodConveyor.ts  # Level 2
│   │       ├── MatchaWhisk.ts   # Level 3
│   │       ├── SailBetweenLights.ts # Level 4
│   │       ├── FrameMoment.ts   # Level 5
│   │       └── RomanticDinner.ts # Level 6
│   └── ui/
│       ├── HUD.ts
│       └── ResultScreen.ts
```

## Game Flow
1. **HomeScene** - Plays intro video, click anywhere to proceed
2. **MapScene** - Walking character on game map, click circles to move/play
3. **ReadyScene** - Shows level info before starting
4. **Minigame** - Play the actual game
5. **ChestScene** - Final reward after all levels complete

## Map System (MapScene.ts)

### Yellow Circle Positions (13 nodes)
These positions match the yellow circles on the map image (1280x720 canvas):

| Index | X | Y | Type | Name |
|-------|-----|-----|------|------|
| 0 | 105 | 275 | Start | Start |
| 1 | 250 | 225 | Path | Path |
| 2 | 400 | 185 | Level 1 | Supercar Dealership (Car) |
| 3 | 735 | 155 | Level 2 | Mexican Restaurant |
| 4 | 325 | 320 | Path | Path |
| 5 | 185 | 390 | Level 3 | Matcha Cafe |
| 6 | 320 | 545 | Level 4 | Sailing in the Sea |
| 7 | 510 | 505 | Path | Path |
| 8 | 660 | 425 | Level 5 | Sunset Area |
| 9 | 870 | 355 | Path | Path |
| 10 | 1095 | 250 | Level 6 | Mountain Dinner |
| 11 | 1160 | 420 | Path | Path |
| 12 | 1115 | 565 | Finish | Finish |

### Path Waypoints
The character walks along the golden path using waypoints between circles:
- Each path segment has intermediate waypoints for curved movement
- Character follows the visual golden line on the map

### Character
- Placeholder Cinnamoroll-style character (white with ears)
- User can replace with custom asset
- Walking animation (feet movement, body bounce)
- Idle animation (gentle bounce)
- Faces direction of movement

### Mechanics
- Click adjacent circle to walk there
- Click current circle to start level (if it's a level node)
- Levels must be completed in order (unlock system)
- Progress saved to localStorage

## Level Order
1. **Car** (Supercar Dealership) - Dodge obstacles
2. **Mexico** (Mexican Restaurant) - Tap foods
3. **Cafe** (Matcha Cafe) - Whisk timing game
4. **Sailing** (Sailing in the Sea) - Steer through gates
5. **Sunset** (Sunset Area) - Photo timing
6. **Mountain Dinner** - Choice-based game
7. **Finish** - Treasure chest reward

## Key Files to Modify

### To adjust circle positions:
Edit `src/scenes/MapScene.ts` → `circleNodes` array

### To adjust walking path:
Edit `src/scenes/MapScene.ts` → `pathSegments` array

### To replace character with custom sprite:
Edit `src/scenes/MapScene.ts` → `createCharacter()` method

### To change game dimensions:
Edit `src/config.ts` → `GAME_WIDTH`, `GAME_HEIGHT`

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Build for production
```

## TODO / Known Issues
- Circle positions may need fine-tuning to match map exactly
- Character is placeholder (user wants to replace with custom asset)
- Walking path waypoints may need adjustment for smoother curves

## Save Data
Stored in localStorage under key `cinnamo-go-save`:
```typescript
interface GameState {
  currentLevelIndex: number;
  completedLevels: boolean[];
  tokensCollected: string[];
  lossCount: Record<number, number>;
  firstPlayComplete: boolean;
}
```

## Map Image
Located at: `public/assets/gameMap.jpg`
Original source: `src/Assets/Untitled design (2).jpg`
