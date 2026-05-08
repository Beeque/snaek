export const GAME_CONFIG = {
  canvasWidth: 960,
  canvasHeight: 640,
  backgroundColor: '#999999',
  snakeColor: '#000000',
  segmentCount: 24,
  headRadius: 18,
  tailRadius: 6,
  radiusFalloff: 0.92,
  segmentSpacing: 12,
  baseSpeed: 220,
  boostMultiplier: 3.5,
  boostEnergyDrain: 85,
  energyRegenRate: 40,
  turnAcceleration: 1400,
  maxTurnSpeed: 280,
  turnDrag: 3,
  waveAmplitude: 15,
  waveFrequency: 1.2,
  maxEnergy: 100,
  actionButtons: Array.from({ length: 10 }, (_, index) => ({
    shortcut: index < 9 ? String(index + 1) : '0',
    description: `Placeholder-painike ${index < 9 ? String(index + 1) : '0'}`
  }))
};
