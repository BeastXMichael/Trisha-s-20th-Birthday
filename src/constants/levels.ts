export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  objective: string;
  sceneKey: string;
  tokenEmoji: string;
  tokenImageKey: string;
  tokenName: string;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 'car',
    name: 'Car Racing!',
    description: 'Drive through a dreamy road!',
    objective: 'Dodge obstacles for 30 seconds',
    sceneKey: 'CarDodging',
    tokenEmoji: '🚗',
    tokenImageKey: 'tokenCar',
    tokenName: 'Car Token',
  },
  {
    id: 'food',
    name: 'Mexican Restaurant',
    description: 'Enjoy some delicious Mexican food!',
    objective: 'Tap Mexican foods to reach the target score',
    sceneKey: 'FoodConveyor',
    tokenEmoji: '🌮',
    tokenImageKey: 'tokenMexico',
    tokenName: 'Mexico Token',
  },
  {
    id: 'matcha',
    name: 'Matcha Time',
    description: 'Whisk up the perfect matcha!',
    objective: 'Hit the sweet spot to fill the foam meter',
    sceneKey: 'MatchaWhisk',
    tokenEmoji: '🍵',
    tokenImageKey: 'tokenMatcha',
    tokenName: 'Matcha Token',
  },
  {
    id: 'sailing',
    name: 'Sailing Moon',
    description: 'Sail through the beautiful lights!',
    objective: 'Steer through the gates',
    sceneKey: 'SailBetweenLights',
    tokenEmoji: '⛵',
    tokenImageKey: 'tokenSailing',
    tokenName: 'Sailing Token',
  },
  {
    id: 'photo',
    name: 'Sunset Photoshoot',
    description: 'Capture the perfect sunset moments!',
    objective: 'Snap photos at the right moment',
    sceneKey: 'FrameMoment',
    tokenEmoji: '📷',
    tokenImageKey: 'tokenSunset',
    tokenName: 'Sunset Token',
  },
  {
    id: 'dinner',
    name: 'Romantic Mountain Dinner',
    description: 'A special dinner together!',
    objective: 'Choose the best answers to fill the love bar',
    sceneKey: 'RomanticDinner',
    tokenEmoji: '❤️',
    tokenImageKey: 'tokenDinner',
    tokenName: 'Dinner Token',
  },
];
