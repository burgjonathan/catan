export const RESOURCES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];

export const TERRAIN_TYPES = ['forest', 'hills', 'pasture', 'fields', 'mountains', 'desert'];

export const TERRAIN_RESOURCE = {
  forest: 'wood',
  hills: 'brick',
  pasture: 'sheep',
  fields: 'wheat',
  mountains: 'ore',
  desert: null
};

export const TERRAIN_COUNTS = {
  forest: 4,
  hills: 3,
  pasture: 4,
  fields: 4,
  mountains: 3,
  desert: 1
};

export const NUMBER_TOKENS = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];

export const COSTS = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { wheat: 2, ore: 3 },
  devCard: { sheep: 1, wheat: 1, ore: 1 }
};

export const DEV_CARD_COUNTS = {
  knight: 14,
  victoryPoint: 5,
  roadBuilding: 2,
  yearOfPlenty: 2,
  monopoly: 2
};

export const BANK_RESOURCE_COUNT = 19;
export const MAX_SETTLEMENTS = 5;
export const MAX_CITIES = 4;
export const MAX_ROADS = 15;
export const VP_TO_WIN = 10;

export const PLAYER_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#2ecc71'];
export const PLAYER_COLOR_NAMES = ['Red', 'Blue', 'Orange', 'Green'];

export const TERRAIN_COLORS = {
  forest: '#2d6a1e',
  hills: '#b5651d',
  pasture: '#7ec850',
  fields: '#f0d048',
  mountains: '#808080',
  desert: '#e8d5a3'
};

export const RESOURCE_COLORS = {
  wood: '#5d4037',
  brick: '#d84315',
  sheep: '#8bc34a',
  wheat: '#fdd835',
  ore: '#78909c'
};

export const RESOURCE_ICONS = {
  wood: '🌲',
  brick: '🧱',
  sheep: '🐑',
  wheat: '🌾',
  ore: '⛏️'
};
