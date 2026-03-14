const BOT_NAMES = [
  'Baron Von Catan',
  'Brick Bishop',
  'Wheat Wizard',
  'Ore Oracle',
  'Sheep Sheriff',
  'Road Runner',
  'Sir Builds-a-Lot',
  'Settler Sally',
  'Captain Trade',
  'The Monopolist',
  'Knight Rider',
  'Port Master',
  'Hex Champion',
  'Desert Fox',
  'Lumber Jack',
  'Stone Cold',
  'Golden Grain',
  'Wool Worth',
  'The Architect',
  'Dice Duchess',
  'Count Resources',
  'Lady Longest Road',
  'Admiral Army',
  'The Trader',
  'Village Elder'
];

export function pickBotNames(count) {
  const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
