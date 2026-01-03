// All numeric tuning values in one place for easy adjustment

export const TUNING = {
  // Car Dodging
  car: {
    gameDuration: 30, // seconds
    lanes: 3,
    startingHealth: 3,
    obstacleSpawnInterval: 1200, // ms
    obstacleSpeed: 300, // pixels per second
    laneWidth: 120,
  },

  // Food Conveyor
  food: {
    gameDuration: 30, // seconds
    targetScore: 15,
    startingHealth: 3,
    beltSpeed: 500, // pixels per second
    spawnInterval: 800, // ms
    mexicanFoodRatio: 0.6, // 60% Mexican foods
    pointsPerCorrect: 1,
  },

  // Matcha Whisk
  matcha: {
    gameDuration: 30, // seconds
    targetFoam: 150,
    rotationSpeed: 2, // radians per second
    sweetSpotArc: 36, // degrees
    foamPerHit: 8,
    foamLossPerMiss: 2,
  },

  // Sailing
  sailing: {
    gameDuration: 30, // seconds
    targetGates: 10,
    boatSpeed: 200, // pixels per second (forward auto-scroll)
    steerSpeed: 300, // pixels per second (left/right)
    gateSpawnInterval: 2000, // ms
    gateWidth: 150,
  },

  // Frame the Moment (Photo)
  photo: {
    gameDuration: 30, // seconds
    targetProgress: 250,
    frameSpeed: 150, // pixels per second
    perfectWindow: 50, // pixels from center
    goodWindow: 100,
    perfectPoints: 15,
    goodPoints: 8,
    missPoints: 2,
  },

  // Romantic Dinner
  dinner: {
    totalPrompts: 6,
    bestAnswerPoints: 20,
    okayAnswerPoints: 10,
    wrongAnswerPoints: 0,
    targetLove: 100,
  },
};
