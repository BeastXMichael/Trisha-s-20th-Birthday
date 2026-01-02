import Phaser from 'phaser';
import { HomeScene } from './scenes/HomeScene';
import { MapScene } from './scenes/MapScene';
import { ReadyScene } from './scenes/ReadyScene';
import { ChestScene } from './scenes/ChestScene';
import { CarDodging } from './scenes/minigames/CarDodging';
import { FoodConveyor } from './scenes/minigames/FoodConveyor';
import { MatchaWhisk } from './scenes/minigames/MatchaWhisk';
import { SailBetweenLights } from './scenes/minigames/SailBetweenLights';
import { FrameMoment } from './scenes/minigames/FrameMoment';
import { RomanticDinner } from './scenes/minigames/RomanticDinner';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    HomeScene,
    MapScene,
    ReadyScene,
    CarDodging,
    FoodConveyor,
    MatchaWhisk,
    SailBetweenLights,
    FrameMoment,
    RomanticDinner,
    ChestScene,
  ],
};

// Pastel color palette (Cinnamoroll aesthetic)
export const COLORS = {
  skyBlue: 0x87CEEB,
  lightBlue: 0xADD8E6,
  pink: 0xFFB6C1,
  cream: 0xFFFDD0,
  white: 0xFFFFFF,
  lavender: 0xE6E6FA,
  mint: 0x98FF98,
  peach: 0xFFDAB9,
  coral: 0xFF7F7F,
  gold: 0xFFD700,
  darkBlue: 0x4A90A4,
  textDark: 0x333333,
};
