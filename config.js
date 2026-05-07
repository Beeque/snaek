export const GAME_CONFIG = {
  canvasWidth: 960,
  canvasHeight: 640,
  backgroundColor: '#999999',
  snakeColor: '#000000',
  segmentCount: 18,
  headRadius: 18,
  tailRadius: 6,
  radiusFalloff: 0.82,
  segmentSpacing: 18,
  baseSpeed: 150,
  turnAcceleration: 220,
  maxTurnSpeed: 120,
  turnDrag: 5,
  waveAmplitude: 5,
  waveFrequency: 0.8,
  actionButtons: Array.from({ length: 10 }, (_, index) => ({
    shortcut: index < 9 ? String(index + 1) : '0',
    description: `Placeholder-painike ${index < 9 ? String(index + 1) : '0'}`
  }))
};
