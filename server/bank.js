import { RESOURCES, BANK_RESOURCE_COUNT, DEV_CARD_COUNTS } from '../shared/constants.js';

export function createBank() {
  const bank = {};
  for (const r of RESOURCES) {
    bank[r] = BANK_RESOURCE_COUNT;
  }
  return bank;
}

export function createEmptyResources() {
  const res = {};
  for (const r of RESOURCES) {
    res[r] = 0;
  }
  return res;
}

export function createDevCardDeck() {
  const deck = [];
  for (const [type, count] of Object.entries(DEV_CARD_COUNTS)) {
    for (let i = 0; i < count; i++) {
      deck.push(type);
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function canAfford(playerResources, cost) {
  for (const [resource, amount] of Object.entries(cost)) {
    if ((playerResources[resource] || 0) < amount) return false;
  }
  return true;
}

export function deductCost(player, bank, cost) {
  for (const [resource, amount] of Object.entries(cost)) {
    player.resources[resource] -= amount;
    bank[resource] += amount;
  }
}

export function addResource(player, bank, resource, amount) {
  if (bank[resource] >= amount) {
    player.resources[resource] += amount;
    bank[resource] -= amount;
    return amount;
  }
  // Bank doesn't have enough
  const available = bank[resource];
  player.resources[resource] += available;
  bank[resource] = 0;
  return available;
}

export function totalResources(player) {
  return Object.values(player.resources).reduce((a, b) => a + b, 0);
}
