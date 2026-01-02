export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  objective: string;
  sceneKey: string;
  tokenEmoji: string;
  tokenName: string;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 'car',
    name: 'Hyundai Discovery Tour',
    description: 'Drive through a dreamy road!',
    objective: 'Dodge obstacles for 45 seconds',
    sceneKey: 'CarDodging',
    tokenEmoji: '🚗',
    tokenName: 'Key',
  },
  {
    id: 'food',
    name: 'Mexican Restaurant Lunch',
    description: 'Enjoy some delicious Mexican food!',
    objective: 'Tap Mexican foods to reach the target score',
    sceneKey: 'FoodConveyor',
    tokenEmoji: '🌮',
    tokenName: 'Taco',
  },
  {
    id: 'matcha',
    name: 'Matcha Time',
    description: 'Whisk up the perfect matcha!',
    objective: 'Hit the sweet spot to fill the foam meter',
    sceneKey: 'MatchaWhisk',
    tokenEmoji: '🍵',
    tokenName: 'Matcha Cup',
  },
  {
    id: 'sailing',
    name: 'Sailing at MBS',
    description: 'Sail through the beautiful lights!',
    objective: 'Steer through the gates',
    sceneKey: 'SailBetweenLights',
    tokenEmoji: '⛵',
    tokenName: 'Sailboat',
  },
  {
    id: 'photo',
    name: 'Sunset Photoshoot',
    description: 'Capture the perfect sunset moments!',
    objective: 'Snap photos at the right moment',
    sceneKey: 'FrameMoment',
    tokenEmoji: '📷',
    tokenName: 'Camera',
  },
  {
    id: 'dinner',
    name: 'Romantic Mountain Dinner',
    description: 'A special dinner together!',
    objective: 'Choose the best answers to fill the love bar',
    sceneKey: 'RomanticDinner',
    tokenEmoji: '❤️',
    tokenName: 'Heart',
  },
];
