import { generateBoard } from './boardGenerator.js';
import { createBank, createEmptyResources, createDevCardDeck, canAfford, deductCost, addResource, totalResources } from './bank.js';
import { COSTS, TERRAIN_RESOURCE, MAX_SETTLEMENTS, MAX_CITIES, MAX_ROADS, RESOURCES } from '../shared/constants.js';
import { getVerticesForHex, getAdjacentVertices, getEdgesForVertex, edgeVertices, vertexKey, getAllVertices, hexPositionsForRadius } from '../shared/hexGeometry.js';
import { updateLongestRoad } from './longestRoad.js';
import { updateLargestArmy } from './largestArmy.js';
import { checkWinner, calculateVP } from './victoryCheck.js';
import { getPlayersWhoMustDiscard, getPlayersToStealFrom, stealRandomResource } from './robber.js';
import { playKnight, playRoadBuilding, playYearOfPlenty, playMonopoly } from './devCards.js';
import * as trading from './trading.js';

function getBoardHexPositions(board) {
  return hexPositionsForRadius(board.boardRadius || 2);
}

export function createGame(roomPlayers, expansion = false) {
  const board = generateBoard(expansion);
  const bank = createBank();
  const devCardDeck = createDevCardDeck();

  const players = roomPlayers.map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar || null,
    color: p.color,
    colorName: p.colorName,
    isBot: p.isBot || false,
    difficulty: p.difficulty || null,
    resources: createEmptyResources(),
    devCards: [],
    newDevCards: [],
    playedKnights: 0,
    hasPlayedDevCardThisTurn: false,
    settlements: [],
    cities: [],
    roads: [],
    ports: [],
    longestRoadLength: 0
  }));

  return {
    board,
    players,
    bank,
    devCardDeck,
    currentPlayerIndex: 0,
    phase: 'setup1', // setup1, setup2, roll, main, robber, discard, steal, roadBuilding, finished
    turnNumber: 1,
    lastDice: null,
    longestRoad: { playerId: null, length: 0 },
    largestArmy: { playerId: null, count: 0 },
    pendingTrade: null,
    discardPending: [],
    setupRound: 1,
    setupPlacedSettlement: false,
    roadBuildingRemaining: 0,
    stealTargets: [],
    gameLog: []
  };
}

function log(state, msg) {
  state.gameLog.push({ text: msg, timestamp: Date.now() });
}

function getCurrentPlayer(state) {
  return state.players[state.currentPlayerIndex];
}

function isCurrentPlayer(state, playerId) {
  return getCurrentPlayer(state).id === playerId;
}

function advanceSetupTurn(state) {
  if (state.setupRound === 1) {
    if (state.currentPlayerIndex < state.players.length - 1) {
      state.currentPlayerIndex++;
    } else {
      state.setupRound = 2;
      // Stay on last player for round 2 (reverse order)
    }
  } else {
    if (state.currentPlayerIndex > 0) {
      state.currentPlayerIndex--;
    } else {
      // Setup complete, start main game
      state.phase = 'roll';
      state.currentPlayerIndex = 0;
      log(state, 'Setup complete! Game begins.');
      return;
    }
  }
  state.setupPlacedSettlement = false;
  state.phase = state.setupRound === 1 ? 'setup1' : 'setup2';
}

function checkPortAccess(state, playerId, vKey) {
  for (const port of state.board.ports) {
    if (port.vertexKeys.includes(vKey)) {
      const player = state.players.find(p => p.id === playerId);
      if (!player.ports.includes(port.type)) {
        player.ports.push(port.type);
      }
    }
  }
}

// ---- SETUP ACTIONS ----

export function placeInitialSettlement(state, playerId, vKey) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'setup1' && state.phase !== 'setup2') throw new Error('Not in setup phase');
  if (state.setupPlacedSettlement) throw new Error('Already placed settlement this turn');

  const vertex = state.board.vertices[vKey];
  if (!vertex) throw new Error('Invalid vertex');
  if (vertex.building) throw new Error('Vertex already occupied');

  // Distance rule: no adjacent settlements/cities
  const hexPositions = getBoardHexPositions(state.board);
  const adjacentVerts = getAdjacentVertices(vKey, hexPositions);
  for (const adjV of adjacentVerts) {
    if (state.board.vertices[adjV] && state.board.vertices[adjV].building) {
      throw new Error('Too close to another settlement');
    }
  }

  const player = getCurrentPlayer(state);
  vertex.building = 'settlement';
  vertex.owner = player.color;
  vertex.ownerId = player.id;
  player.settlements.push(vKey);
  checkPortAccess(state, playerId, vKey);

  // In setup round 2, give resources from adjacent hexes
  if (state.phase === 'setup2') {
    const adjacentHexes = getHexesForVertexFromBoard(state.board, vKey);
    for (const hex of adjacentHexes) {
      const resource = TERRAIN_RESOURCE[hex.terrain];
      if (resource) {
        addResource(player, state.bank, resource, 1);
      }
    }
  }

  state.setupPlacedSettlement = true;
  log(state, `${player.name} placed a settlement`);
  return state;
}

function getHexesForVertexFromBoard(board, vKey) {
  const hexPositions = getBoardHexPositions(board);
  const hexes = [];
  for (const hex of board.hexes) {
    const verts = getVerticesForHex(hex.q, hex.r, hexPositions);
    if (verts.includes(vKey)) {
      hexes.push(hex);
    }
  }
  return hexes;
}

export function placeInitialRoad(state, playerId, eKey) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'setup1' && state.phase !== 'setup2') throw new Error('Not in setup phase');
  if (!state.setupPlacedSettlement) throw new Error('Place settlement first');

  const edge = state.board.edges[eKey];
  if (!edge) throw new Error('Invalid edge');
  if (edge.road) throw new Error('Road already exists');

  const player = getCurrentPlayer(state);
  const [v1, v2] = edgeVertices(eKey);

  // Must connect to the just-placed settlement
  const lastSettlement = player.settlements[player.settlements.length - 1];
  if (v1 !== lastSettlement && v2 !== lastSettlement) {
    throw new Error('Road must connect to your settlement');
  }

  edge.road = true;
  edge.owner = player.color;
  edge.ownerId = player.id;
  player.roads.push(eKey);

  log(state, `${player.name} placed a road`);
  advanceSetupTurn(state);
  return state;
}

// ---- MAIN GAME ACTIONS ----

export function rollDice(state, playerId) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'roll') throw new Error('Not in roll phase');

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;
  state.lastDice = [die1, die2];

  const player = getCurrentPlayer(state);
  log(state, `${player.name} rolled ${die1} + ${die2} = ${total}`);

  if (total === 7) {
    // Check for discards
    const mustDiscard = getPlayersWhoMustDiscard(state);
    if (mustDiscard.length > 0) {
      state.discardPending = mustDiscard;
      state.phase = 'discard';
    } else {
      state.phase = 'robber';
    }
  } else {
    // Distribute resources
    const hexPositions = getBoardHexPositions(state.board);
    for (const hex of state.board.hexes) {
      if (hex.number !== total) continue;
      if (hex.hasRobber || (hex.q === state.board.robberHex.q && hex.r === state.board.robberHex.r)) continue;

      const resource = TERRAIN_RESOURCE[hex.terrain];
      if (!resource) continue;

      const vertexKeys = getVerticesForHex(hex.q, hex.r, hexPositions);
      for (const vKey of vertexKeys) {
        const vertex = state.board.vertices[vKey];
        if (vertex && vertex.ownerId) {
          const owner = state.players.find(p => p.id === vertex.ownerId);
          if (owner) {
            const amount = vertex.building === 'city' ? 2 : 1;
            addResource(owner, state.bank, resource, amount);
          }
        }
      }
    }
    state.phase = 'main';
  }

  return { state, dice: { die1, die2, total } };
}

export function discardResources(state, playerId, resources) {
  if (!state.discardPending.includes(playerId)) throw new Error('You do not need to discard');

  const player = state.players.find(p => p.id === playerId);
  const playerTotal = totalResources(player);
  const discardCount = Math.floor(playerTotal / 2);

  let totalDiscarding = 0;
  for (const [resource, amount] of Object.entries(resources)) {
    if (amount < 0) throw new Error('Invalid discard amount');
    if (player.resources[resource] < amount) throw new Error(`Not enough ${resource}`);
    totalDiscarding += amount;
  }
  if (totalDiscarding !== discardCount) throw new Error(`Must discard exactly ${discardCount} cards`);

  for (const [resource, amount] of Object.entries(resources)) {
    player.resources[resource] -= amount;
    state.bank[resource] += amount;
  }

  state.discardPending = state.discardPending.filter(id => id !== playerId);
  log(state, `${player.name} discarded ${discardCount} cards`);

  if (state.discardPending.length === 0) {
    state.phase = 'robber';
  }
  return state;
}

export function moveRobber(state, playerId, hexQ, hexR) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'robber') throw new Error('Not in robber phase');

  if (hexQ === state.board.robberHex.q && hexR === state.board.robberHex.r) {
    throw new Error('Must move robber to a different hex');
  }

  // Clear old robber
  const oldHex = state.board.hexes.find(h => h.q === state.board.robberHex.q && h.r === state.board.robberHex.r);
  if (oldHex) oldHex.hasRobber = false;

  // Place new robber
  state.board.robberHex = { q: hexQ, r: hexR };
  const newHex = state.board.hexes.find(h => h.q === hexQ && h.r === hexR);
  if (newHex) newHex.hasRobber = true;

  const player = getCurrentPlayer(state);
  log(state, `${player.name} moved the robber`);

  // Check for steal targets
  const targets = getPlayersToStealFrom(state, hexQ, hexR, playerId);
  if (targets.length > 0) {
    state.stealTargets = targets;
    state.phase = 'steal';
  } else {
    state.phase = 'main';
  }

  return state;
}

export function stealResource(state, playerId, targetId) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'steal') throw new Error('Not in steal phase');
  if (!state.stealTargets.includes(targetId)) throw new Error('Invalid steal target');

  const player = getCurrentPlayer(state);
  const target = state.players.find(p => p.id === targetId);
  const resource = stealRandomResource(target);

  if (resource) {
    target.resources[resource]--;
    player.resources[resource]++;
    log(state, `${player.name} stole a resource from ${target.name}`);
  }

  state.stealTargets = [];
  state.phase = 'main';
  return state;
}

export function buildSettlement(state, playerId, vKey) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'main') throw new Error('Not in main phase');

  const player = getCurrentPlayer(state);
  if (player.settlements.length >= MAX_SETTLEMENTS) throw new Error('Max settlements reached');
  if (!canAfford(player.resources, COSTS.settlement)) throw new Error('Cannot afford settlement');

  const vertex = state.board.vertices[vKey];
  if (!vertex) throw new Error('Invalid vertex');
  if (vertex.building) throw new Error('Vertex already occupied');

  // Distance rule
  const hexPositions = getBoardHexPositions(state.board);
  const adjacentVerts = getAdjacentVertices(vKey, hexPositions);
  for (const adjV of adjacentVerts) {
    if (state.board.vertices[adjV] && state.board.vertices[adjV].building) {
      throw new Error('Too close to another settlement');
    }
  }

  // Must connect to player's road network
  const connectedEdges = getEdgesForVertex(vKey, hexPositions);
  const hasConnectedRoad = connectedEdges.some(eKey => {
    const edge = state.board.edges[eKey];
    return edge && edge.ownerId === playerId;
  });
  if (!hasConnectedRoad) throw new Error('Must be connected to your road network');

  deductCost(player, state.bank, COSTS.settlement);
  vertex.building = 'settlement';
  vertex.owner = player.color;
  vertex.ownerId = player.id;
  player.settlements.push(vKey);
  checkPortAccess(state, playerId, vKey);

  log(state, `${player.name} built a settlement`);
  updateLongestRoad(state); // Building can break opponent's road
  return state;
}

export function buildCity(state, playerId, vKey) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'main') throw new Error('Not in main phase');

  const player = getCurrentPlayer(state);
  if (player.cities.length >= MAX_CITIES) throw new Error('Max cities reached');
  if (!canAfford(player.resources, COSTS.city)) throw new Error('Cannot afford city');

  const vertex = state.board.vertices[vKey];
  if (!vertex || vertex.building !== 'settlement' || vertex.ownerId !== playerId) {
    throw new Error('Must upgrade your own settlement');
  }

  deductCost(player, state.bank, COSTS.city);
  vertex.building = 'city';
  player.settlements = player.settlements.filter(v => v !== vKey);
  player.cities.push(vKey);

  log(state, `${player.name} built a city`);
  return state;
}

export function buildRoad(state, playerId, eKey) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'main' && state.phase !== 'roadBuilding') throw new Error('Not in correct phase');

  const player = getCurrentPlayer(state);
  if (player.roads.length >= MAX_ROADS) throw new Error('Max roads reached');

  const isFree = state.phase === 'roadBuilding';
  if (!isFree && !canAfford(player.resources, COSTS.road)) throw new Error('Cannot afford road');

  const edge = state.board.edges[eKey];
  if (!edge) throw new Error('Invalid edge');
  if (edge.road) throw new Error('Road already exists');

  // Must connect to player's road/settlement/city
  const hexPositionsRoad = getBoardHexPositions(state.board);
  const [v1, v2] = edgeVertices(eKey);
  const connected = [v1, v2].some(v => {
    const vert = state.board.vertices[v];
    if (vert && vert.ownerId === playerId) return true;
    const adjEdges = getEdgesForVertex(v, hexPositionsRoad);
    return adjEdges.some(ae => {
      const adjEdge = state.board.edges[ae];
      return adjEdge && adjEdge.ownerId === playerId;
    });
  });
  if (!connected) throw new Error('Must connect to your network');

  if (!isFree) deductCost(player, state.bank, COSTS.road);
  edge.road = true;
  edge.owner = player.color;
  edge.ownerId = player.id;
  player.roads.push(eKey);

  log(state, `${player.name} built a road`);
  updateLongestRoad(state);

  if (state.phase === 'roadBuilding') {
    state.roadBuildingRemaining--;
    if (state.roadBuildingRemaining <= 0) {
      state.phase = 'main';
    }
  }

  return state;
}

export function buyDevCard(state, playerId) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'main') throw new Error('Not in main phase');

  const player = getCurrentPlayer(state);
  if (!canAfford(player.resources, COSTS.devCard)) throw new Error('Cannot afford development card');
  if (state.devCardDeck.length === 0) throw new Error('No development cards left');

  deductCost(player, state.bank, COSTS.devCard);
  const card = state.devCardDeck.pop();
  player.newDevCards.push(card);

  log(state, `${player.name} bought a development card`);
  return state;
}

export function playDevCard(state, playerId, cardType, params) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'main' && state.phase !== 'roll') throw new Error('Not in correct phase');

  const player = getCurrentPlayer(state);
  if (player.hasPlayedDevCardThisTurn) throw new Error('Already played a dev card this turn');

  const cardIndex = player.devCards.indexOf(cardType);
  if (cardIndex === -1) throw new Error('You do not have that card');
  if (cardType === 'victoryPoint') throw new Error('VP cards are auto-revealed');

  player.devCards.splice(cardIndex, 1);
  player.hasPlayedDevCardThisTurn = true;

  log(state, `${player.name} played ${cardType}`);

  switch (cardType) {
    case 'knight':
      return playKnight(state, playerId);
    case 'roadBuilding':
      return playRoadBuilding(state, playerId);
    case 'yearOfPlenty':
      return playYearOfPlenty(state, playerId, params.resource1, params.resource2);
    case 'monopoly':
      return playMonopoly(state, playerId, params.resource);
    default:
      throw new Error('Unknown card type');
  }
}

export function endTurn(state, playerId) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'main') throw new Error('Cannot end turn now');

  const player = getCurrentPlayer(state);
  // Move new dev cards to playable hand
  player.devCards.push(...player.newDevCards);
  player.newDevCards = [];
  player.hasPlayedDevCardThisTurn = false;

  // Cancel any pending trade
  state.pendingTrade = null;

  // Advance to next player
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.phase = 'roll';
  state.turnNumber++;

  const nextPlayer = getCurrentPlayer(state);
  log(state, `It's ${nextPlayer.name}'s turn`);
  return state;
}

// Trade wrappers
export function tradeOffer(state, playerId, offering, requesting) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'main') throw new Error('Not in main phase');
  return trading.createTradeOffer(state, playerId, offering, requesting);
}

export function tradeAccept(state, playerId) {
  return trading.acceptTrade(state, playerId);
}

export function tradeReject(state, playerId) {
  return trading.rejectTrade(state, playerId);
}

export function tradeCancel(state, playerId) {
  return trading.cancelTrade(state);
}

export function tradeWithBank(state, playerId, givingResource, givingAmount, receivingResource) {
  if (!isCurrentPlayer(state, playerId)) throw new Error('Not your turn');
  if (state.phase !== 'main') throw new Error('Not in main phase');
  return trading.bankTrade(state, playerId, givingResource, givingAmount, receivingResource);
}

export { checkWinner, calculateVP };
