import { TERRAIN_RESOURCE, COSTS, RESOURCES, MAX_SETTLEMENTS, MAX_CITIES, MAX_ROADS } from '../shared/constants.js';
import { getVerticesForHex, getAdjacentVertices, getEdgesForVertex, edgeVertices, getAllVertices, hexPositionsForRadius } from '../shared/hexGeometry.js';
import { canAfford, totalResources } from './bank.js';
import { calculateVP } from './victoryCheck.js';

function getBoardHexPositions(state) {
  return hexPositionsForRadius(state.board.boardRadius || 2);
}

// Probability pips for each dice number
const PIPS = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 0, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };

function getHexesForVertex(board, vKey, hexPositions) {
  const hexes = [];
  for (const hex of board.hexes) {
    const verts = getVerticesForHex(hex.q, hex.r, hexPositions);
    if (verts.includes(vKey)) hexes.push(hex);
  }
  return hexes;
}

function scoreVertex(board, vKey, playerId, state) {
  const hexPositions = getBoardHexPositions(state);
  const hexes = getHexesForVertex(board, vKey, hexPositions);
  let score = 0;
  const resourceTypes = new Set();

  for (const hex of hexes) {
    const resource = TERRAIN_RESOURCE[hex.terrain];
    if (!resource) continue;
    const robbed = hex.q === state.board.robberHex.q && hex.r === state.board.robberHex.r;
    if (!robbed && hex.number) {
      score += PIPS[hex.number] || 0;
    }
    resourceTypes.add(resource);
  }

  // Diversity bonus
  score += resourceTypes.size * 2;

  // Port bonus
  for (const port of board.ports) {
    if (port.vertexKeys.includes(vKey)) {
      if (port.type === '3:1') score += 3;
      else score += 5;
    }
  }

  return score;
}

function getValidSetupVertices(state) {
  const hexPositions = getBoardHexPositions(state);
  const allVerts = getAllVertices(hexPositions);
  return allVerts.filter(vKey => {
    const vertex = state.board.vertices[vKey];
    if (!vertex || vertex.building) return false;
    const adj = getAdjacentVertices(vKey, hexPositions);
    return !adj.some(a => state.board.vertices[a] && state.board.vertices[a].building);
  });
}

function getResourcesForVertex(board, vKey, hexPositions) {
  const hexes = getHexesForVertex(board, vKey, hexPositions);
  const resources = new Set();
  for (const hex of hexes) {
    const r = TERRAIN_RESOURCE[hex.terrain];
    if (r) resources.add(r);
  }
  return resources;
}

// ---- SETUP ----

export function chooseSetupSettlement(state, botPlayerId, difficulty) {
  const valid = getValidSetupVertices(state);
  if (valid.length === 0) return null;

  const scored = valid.map(vKey => ({
    vKey,
    score: scoreVertex(state.board, vKey, botPlayerId, state)
  }));
  scored.sort((a, b) => b.score - a.score);

  const bot = state.players.find(p => p.id === botPlayerId);
  const hexPositions = getBoardHexPositions(state);

  // Round 2: boost complementary resources
  if (state.phase === 'setup2' && bot.settlements.length > 0) {
    const existingResources = getResourcesForVertex(state.board, bot.settlements[0], hexPositions);
    for (const item of scored) {
      const newResources = getResourcesForVertex(state.board, item.vKey, hexPositions);
      for (const r of newResources) {
        if (!existingResources.has(r)) item.score += 3;
      }
    }
    scored.sort((a, b) => b.score - a.score);
  }

  if (difficulty === 'easy') {
    // 30% fully random, otherwise pick from top 60%
    if (Math.random() < 0.3) {
      return valid[Math.floor(Math.random() * valid.length)];
    }
    const topCount = Math.max(1, Math.ceil(scored.length * 0.6));
    return scored[Math.floor(Math.random() * topCount)].vKey;
  }

  if (difficulty === 'medium') {
    // Add noise and pick best
    for (const item of scored) {
      item.score += (Math.random() - 0.5) * 4;
    }
    scored.sort((a, b) => b.score - a.score);
    return scored[0].vKey;
  }

  // Hard: pick best, with extra scoring for resource combos
  for (const item of scored) {
    const resources = getResourcesForVertex(state.board, item.vKey, hexPositions);
    // Wheat+ore combo for cities
    if (resources.has('wheat') && resources.has('ore')) item.score += 3;
    // Wood+brick for expansion
    if (resources.has('wood') && resources.has('brick')) item.score += 2;
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0].vKey;
}

export function chooseSetupRoad(state, botPlayerId, difficulty) {
  const bot = state.players.find(p => p.id === botPlayerId);
  const hexPositions = getBoardHexPositions(state);
  const lastSettlement = bot.settlements[bot.settlements.length - 1];
  const edges = getEdgesForVertex(lastSettlement, hexPositions);
  const validEdges = edges.filter(eKey => {
    const edge = state.board.edges[eKey];
    return edge && !edge.road;
  });

  if (validEdges.length === 0) return null;
  if (difficulty === 'easy') {
    return validEdges[Math.floor(Math.random() * validEdges.length)];
  }

  // Score edges by what the other endpoint expands toward
  const scored = validEdges.map(eKey => {
    const [v1, v2] = edgeVertices(eKey);
    const otherVertex = v1 === lastSettlement ? v2 : v1;
    let score = scoreVertex(state.board, otherVertex, botPlayerId, state);

    // Hard: look one more step ahead
    if (difficulty === 'hard') {
      const nextEdges = getEdgesForVertex(otherVertex, hexPositions).filter(e => {
        const edge = state.board.edges[e];
        return edge && !edge.road && e !== eKey;
      });
      for (const ne of nextEdges) {
        const [nv1, nv2] = edgeVertices(ne);
        const nv = nv1 === otherVertex ? nv2 : nv1;
        score += scoreVertex(state.board, nv, botPlayerId, state) * 0.3;
      }
    }

    return { eKey, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].eKey;
}

// ---- ROBBER ----

export function chooseRobberHex(state, botPlayerId, difficulty) {
  const currentRobber = state.board.robberHex;
  const validHexes = state.board.hexes.filter(h =>
    !(h.q === currentRobber.q && h.r === currentRobber.r)
  );

  if (difficulty === 'easy') {
    return validHexes[Math.floor(Math.random() * validHexes.length)];
  }

  // Score hexes by how much they hurt opponents
  const hexPositions = getBoardHexPositions(state);
  const scored = validHexes.map(hex => {
    let score = 0;
    const verts = getVerticesForHex(hex.q, hex.r, hexPositions);
    for (const vKey of verts) {
      const vertex = state.board.vertices[vKey];
      if (!vertex || !vertex.ownerId) continue;
      if (vertex.ownerId === botPlayerId) {
        score -= (difficulty === 'hard' ? 20 : 5); // Avoid own hexes
      } else {
        const owner = state.players.find(p => p.id === vertex.ownerId);
        const vp = calculateVP(state, owner.id);
        const amount = vertex.building === 'city' ? 2 : 1;
        score += amount * (PIPS[hex.number] || 0);
        if (difficulty === 'hard') {
          score += vp.total * 2; // Target players close to winning
        }
      }
    }
    // Prefer high-probability hexes
    if (difficulty === 'hard') {
      score += (PIPS[hex.number] || 0);
    }
    return { q: hex.q, r: hex.r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return { q: scored[0].q, r: scored[0].r };
}

export function chooseStealTarget(state, botPlayerId, difficulty) {
  const targets = state.stealTargets;
  if (targets.length === 0) return null;
  if (targets.length === 1) return targets[0];

  if (difficulty === 'easy') {
    return targets[Math.floor(Math.random() * targets.length)];
  }

  if (difficulty === 'medium') {
    // Target player with most resources
    let best = targets[0];
    let bestCount = 0;
    for (const tid of targets) {
      const p = state.players.find(pl => pl.id === tid);
      const count = totalResources(p);
      if (count > bestCount) { bestCount = count; best = tid; }
    }
    return best;
  }

  // Hard: target player closest to winning
  let best = targets[0];
  let bestVP = 0;
  for (const tid of targets) {
    const vp = calculateVP(state, tid);
    if (vp.total > bestVP) { bestVP = vp.total; best = tid; }
  }
  return best;
}

// ---- DISCARD ----

export function chooseDiscard(state, botPlayerId, difficulty) {
  const bot = state.players.find(p => p.id === botPlayerId);
  const total = totalResources(bot);
  const discardCount = Math.floor(total / 2);
  const toDiscard = {};
  for (const r of RESOURCES) toDiscard[r] = 0;

  if (difficulty === 'easy') {
    // Random discard
    const pool = [];
    for (const r of RESOURCES) {
      for (let i = 0; i < bot.resources[r]; i++) pool.push(r);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (let i = 0; i < discardCount; i++) {
      toDiscard[pool[i]]++;
    }
    return toDiscard;
  }

  // Medium/Hard: keep resources toward builds, discard excess
  const priorities = getBuildPriorities(state, botPlayerId);
  const keep = {};
  for (const r of RESOURCES) keep[r] = 0;

  // Mark resources we want to keep for highest priority build
  for (const build of priorities) {
    const cost = COSTS[build];
    if (!cost) continue;
    for (const [r, amt] of Object.entries(cost)) {
      keep[r] = Math.max(keep[r], amt);
    }
    break; // Keep resources for top priority only
  }

  // Discard resources exceeding what we want to keep
  let remaining = discardCount;
  // First pass: discard excess
  for (const r of RESOURCES) {
    const excess = Math.max(0, bot.resources[r] - keep[r]);
    const disc = Math.min(excess, remaining);
    toDiscard[r] += disc;
    remaining -= disc;
  }
  // Second pass: discard anything if still need more
  if (remaining > 0) {
    for (const r of RESOURCES) {
      const canDiscard = bot.resources[r] - toDiscard[r];
      const disc = Math.min(canDiscard, remaining);
      toDiscard[r] += disc;
      remaining -= disc;
    }
  }
  return toDiscard;
}

// ---- MAIN PHASE ----

function getBuildPriorities(state, botPlayerId) {
  const bot = state.players.find(p => p.id === botPlayerId);
  const priorities = [];

  // Can build city?
  if (bot.settlements.length > 0 && bot.cities.length < MAX_CITIES) {
    priorities.push('city');
  }
  // Can build settlement?
  if (bot.settlements.length < MAX_SETTLEMENTS && getValidSettlementSpots(state, botPlayerId).length > 0) {
    priorities.push('settlement');
  }
  // Road
  if (bot.roads.length < MAX_ROADS) {
    priorities.push('road');
  }
  // Dev card
  priorities.push('devCard');

  return priorities;
}

function getValidSettlementSpots(state, playerId) {
  const hexPositions = getBoardHexPositions(state);
  const allVerts = getAllVertices(hexPositions);
  return allVerts.filter(vKey => {
    const vertex = state.board.vertices[vKey];
    if (!vertex || vertex.building) return false;
    // Distance rule
    const adj = getAdjacentVertices(vKey, hexPositions);
    if (adj.some(a => state.board.vertices[a] && state.board.vertices[a].building)) return false;
    // Must connect to player's road
    const edges = getEdgesForVertex(vKey, hexPositions);
    return edges.some(eKey => {
      const edge = state.board.edges[eKey];
      return edge && edge.ownerId === playerId;
    });
  });
}

function getValidRoadSpots(state, playerId) {
  const hexPositions = getBoardHexPositions(state);
  const bot = state.players.find(p => p.id === playerId);
  const validEdges = [];
  // Check all edges connected to player's network
  const visited = new Set();
  const toCheck = [...bot.roads];
  for (const settlement of bot.settlements) {
    const edges = getEdgesForVertex(settlement, hexPositions);
    toCheck.push(...edges);
  }
  for (const city of bot.cities) {
    const edges = getEdgesForVertex(city, hexPositions);
    toCheck.push(...edges);
  }

  for (const eKey of toCheck) {
    if (visited.has(eKey)) continue;
    visited.add(eKey);
    const edge = state.board.edges[eKey];
    if (!edge || edge.road) continue;

    // Check connectivity
    const [v1, v2] = edgeVertices(eKey);
    const connected = [v1, v2].some(v => {
      const vert = state.board.vertices[v];
      if (vert && vert.ownerId === playerId) return true;
      const adjEdges = getEdgesForVertex(v, hexPositions);
      return adjEdges.some(ae => {
        const adjEdge = state.board.edges[ae];
        return adjEdge && adjEdge.ownerId === playerId;
      });
    });
    if (connected) validEdges.push(eKey);
  }
  return validEdges;
}

function getTradeRatio(state, playerId, resource) {
  let ratio = 4;
  for (const port of state.board.ports) {
    const hasPort = port.vertexKeys.some(vKey => {
      const v = state.board.vertices[vKey];
      return v && v.ownerId === playerId;
    });
    if (hasPort) {
      if (port.type === '3:1') ratio = Math.min(ratio, 3);
      else if (port.type === resource) ratio = Math.min(ratio, 2);
    }
  }
  return ratio;
}

function findBankTrade(state, botPlayerId, targetCost, difficulty, simResources) {
  const resources = simResources || state.players.find(p => p.id === botPlayerId).resources;

  // Find which resources we're missing for the target build
  const missing = {};
  for (const [r, amt] of Object.entries(targetCost)) {
    const deficit = amt - (resources[r] || 0);
    if (deficit > 0) missing[r] = deficit;
  }

  // If nothing missing, no trade needed
  if (Object.keys(missing).length === 0) return null;

  // Find a resource we have excess of to trade
  for (const giveResource of RESOURCES) {
    const ratio = getTradeRatio(state, botPlayerId, giveResource);
    if (difficulty === 'easy') continue; // Easy never trades
    if (difficulty === 'medium' && ratio > 3) continue; // Medium only at 3:1 or better

    const available = resources[giveResource] || 0;
    // Don't trade away resources we need for this build
    const neededForBuild = targetCost[giveResource] || 0;
    const surplus = available - neededForBuild;

    if (surplus >= ratio) {
      // Find what we need most
      for (const [needResource, needAmt] of Object.entries(missing)) {
        if (state.bank[needResource] > 0) {
          return { givingResource: giveResource, givingAmount: ratio, receivingResource: needResource };
        }
      }
    }
  }
  return null;
}

export function chooseMainPhaseActions(state, botPlayerId, difficulty) {
  const bot = state.players.find(p => p.id === botPlayerId);
  // Work with a copy of resources for planning (don't mutate real state)
  const simResources = { ...bot.resources };
  const actions = [];

  // Dev card play consideration
  const devCardAction = chooseDevCardToPlay(state, botPlayerId, difficulty);
  if (devCardAction) {
    actions.push(devCardAction);
    // If playing a knight or road building, return early — phase will change
    if (devCardAction.params.cardType === 'knight' || devCardAction.params.cardType === 'roadBuilding') {
      return actions;
    }
  }

  // Easy: only do one thing per turn
  const maxActions = difficulty === 'easy' ? 1 : 10;
  let actionCount = 0;

  // Try to build city
  if (actionCount < maxActions && canAfford(simResources, COSTS.city) && bot.settlements.length > 0 && bot.cities.length < MAX_CITIES) {
    // Pick best settlement to upgrade
    const bestSettlement = pickBestSettlementToUpgrade(state, botPlayerId, difficulty);
    if (bestSettlement) {
      actions.push({ action: 'buildCity', params: { vertexKey: bestSettlement } });
      actionCount++;
      // Simulate resource deduction for further planning
      for (const [r, amt] of Object.entries(COSTS.city)) {
        simResources[r] -= amt;
      }
    }
  }

  // Try to build settlement
  if (actionCount < maxActions && canAfford(simResources, COSTS.settlement) && bot.settlements.length < MAX_SETTLEMENTS) {
    const spots = getValidSettlementSpots(state, botPlayerId);
    if (spots.length > 0) {
      const best = pickBestSettlementSpot(state, botPlayerId, spots, difficulty);
      if (best) {
        actions.push({ action: 'buildSettlement', params: { vertexKey: best } });
        actionCount++;
        for (const [r, amt] of Object.entries(COSTS.settlement)) {
          simResources[r] -= amt;
        }
      }
    }
  }

  // Try to build road (if it opens settlement spots)
  if (actionCount < maxActions && canAfford(simResources, COSTS.road) && bot.roads.length < MAX_ROADS) {
    const shouldBuildRoad = difficulty === 'easy' ? Math.random() < 0.3 :
      getValidSettlementSpots(state, botPlayerId).length === 0 || shouldPursueRoad(state, botPlayerId, difficulty);
    if (shouldBuildRoad) {
      const roadSpots = getValidRoadSpots(state, botPlayerId);
      if (roadSpots.length > 0) {
        const bestRoad = pickBestRoad(state, botPlayerId, roadSpots, difficulty);
        if (bestRoad) {
          actions.push({ action: 'buildRoad', params: { edgeKey: bestRoad } });
          actionCount++;
          for (const [r, amt] of Object.entries(COSTS.road)) {
            simResources[r] -= amt;
          }
        }
      }
    }
  }

  // Buy dev card
  if (actionCount < maxActions && canAfford(simResources, COSTS.devCard) && state.devCardDeck.length > 0) {
    const shouldBuy = difficulty === 'easy' ? Math.random() < 0.3 :
      difficulty === 'medium' ? Math.random() < 0.5 : true;
    if (shouldBuy) {
      actions.push({ action: 'buyDevCard', params: {} });
      actionCount++;
      for (const [r, amt] of Object.entries(COSTS.devCard)) {
        simResources[r] -= amt;
      }
    }
  }

  // Try bank trading to enable a build (medium/hard only)
  if (actionCount < maxActions && difficulty !== 'easy') {
    const buildTargets = [COSTS.city, COSTS.settlement, COSTS.road, COSTS.devCard];
    for (const cost of buildTargets) {
      const trade = findBankTrade(state, botPlayerId, cost, difficulty, simResources);
      if (trade) {
        actions.push({ action: 'tradeWithBank', params: trade });
        // Don't count as actionCount — we'll try to build after trading
        break;
      }
    }
  }

  // Always end turn
  actions.push({ action: 'endTurn', params: {} });
  return actions;
}

function pickBestSettlementToUpgrade(state, botPlayerId, difficulty) {
  const bot = state.players.find(p => p.id === botPlayerId);
  if (difficulty === 'easy') {
    return bot.settlements[Math.floor(Math.random() * bot.settlements.length)];
  }
  // Pick settlement with highest pip score
  let best = null, bestScore = -1;
  for (const vKey of bot.settlements) {
    const score = scoreVertex(state.board, vKey, botPlayerId, state);
    if (score > bestScore) { bestScore = score; best = vKey; }
  }
  return best;
}

function pickBestSettlementSpot(state, botPlayerId, spots, difficulty) {
  if (difficulty === 'easy') {
    return spots[Math.floor(Math.random() * spots.length)];
  }
  let best = null, bestScore = -1;
  for (const vKey of spots) {
    let score = scoreVertex(state.board, vKey, botPlayerId, state);
    if (difficulty === 'medium') {
      score += (Math.random() - 0.5) * 4;
    }
    if (score > bestScore) { bestScore = score; best = vKey; }
  }
  return best;
}

function shouldPursueRoad(state, botPlayerId, difficulty) {
  if (difficulty !== 'hard') return Math.random() < 0.4;
  const bot = state.players.find(p => p.id === botPlayerId);
  // Pursue if close to longest road or need to reach settlement spots
  const currentLongest = state.longestRoad;
  if (currentLongest.playerId !== botPlayerId && bot.longestRoadLength >= (currentLongest.length - 2)) {
    return true;
  }
  return getValidSettlementSpots(state, botPlayerId).length === 0;
}

function pickBestRoad(state, botPlayerId, roadSpots, difficulty) {
  if (difficulty === 'easy') {
    return roadSpots[Math.floor(Math.random() * roadSpots.length)];
  }

  const hexPositions = getBoardHexPositions(state);
  // Score roads by what they lead to
  const scored = roadSpots.map(eKey => {
    const [v1, v2] = edgeVertices(eKey);
    let score = 0;
    for (const v of [v1, v2]) {
      const vertex = state.board.vertices[v];
      if (!vertex || vertex.building) continue;
      // Check if this vertex is a valid settlement spot
      const adj = getAdjacentVertices(v, hexPositions);
      const noNeighbors = !adj.some(a => state.board.vertices[a] && state.board.vertices[a].building);
      if (noNeighbors) {
        score += scoreVertex(state.board, v, botPlayerId, state);
      }
    }
    return { eKey, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].eKey;
}

function chooseDevCardToPlay(state, botPlayerId, difficulty) {
  const bot = state.players.find(p => p.id === botPlayerId);
  if (bot.hasPlayedDevCardThisTurn || bot.devCards.length === 0) return null;

  // Easy: rarely plays dev cards
  if (difficulty === 'easy' && Math.random() < 0.7) return null;

  // Knight: play if it would give largest army, or just to use robber
  if (bot.devCards.includes('knight')) {
    const currentArmy = state.largestArmy;
    const wouldGiveLargest = bot.playedKnights + 1 >= 3 &&
      (!currentArmy.playerId || bot.playedKnights + 1 > currentArmy.count);

    if (difficulty === 'hard' && wouldGiveLargest) {
      return { action: 'playDevCard', params: { cardType: 'knight' } };
    }
    if (difficulty === 'medium' && (wouldGiveLargest || Math.random() < 0.4)) {
      return { action: 'playDevCard', params: { cardType: 'knight' } };
    }
    if (difficulty === 'easy' && Math.random() < 0.3) {
      return { action: 'playDevCard', params: { cardType: 'knight' } };
    }
  }

  // Year of Plenty: pick resources we need most
  if (bot.devCards.includes('yearOfPlenty')) {
    const needed = getMostNeededResources(state, botPlayerId, 2);
    return { action: 'playDevCard', params: { cardType: 'yearOfPlenty', resource1: needed[0], resource2: needed[1] } };
  }

  // Monopoly: pick resource opponents have most of
  if (bot.devCards.includes('monopoly')) {
    const bestResource = getMonopolyTarget(state, botPlayerId, difficulty);
    if (bestResource) {
      return { action: 'playDevCard', params: { cardType: 'monopoly', resource: bestResource } };
    }
  }

  // Road Building: play if we need roads
  if (bot.devCards.includes('roadBuilding')) {
    const roadSpots = getValidRoadSpots(state, botPlayerId);
    if (roadSpots.length >= 2) {
      return { action: 'playDevCard', params: { cardType: 'roadBuilding' } };
    }
  }

  return null;
}

function getMostNeededResources(state, botPlayerId, count) {
  const bot = state.players.find(p => p.id === botPlayerId);
  // Look at what we need for builds
  const needs = {};
  for (const r of RESOURCES) needs[r] = 0;

  for (const [buildType, cost] of Object.entries(COSTS)) {
    for (const [r, amt] of Object.entries(cost)) {
      const deficit = Math.max(0, amt - (bot.resources[r] || 0));
      needs[r] += deficit;
    }
  }

  const sorted = RESOURCES.slice().sort((a, b) => needs[b] - needs[a]);
  return sorted.slice(0, count);
}

function getMonopolyTarget(state, botPlayerId, difficulty) {
  if (difficulty === 'easy') {
    return RESOURCES[Math.floor(Math.random() * RESOURCES.length)];
  }

  // Pick resource that opponents collectively have the most of
  let bestResource = null, bestCount = 0;
  for (const r of RESOURCES) {
    let count = 0;
    for (const p of state.players) {
      if (p.id === botPlayerId) continue;
      count += p.resources[r] || 0;
    }
    if (count > bestCount) { bestCount = count; bestResource = r; }
  }
  return bestResource || RESOURCES[0];
}

// ---- ROAD BUILDING PHASE ----

export function chooseRoadBuildingRoad(state, botPlayerId, difficulty) {
  const roadSpots = getValidRoadSpots(state, botPlayerId);
  if (roadSpots.length === 0) return null;
  return pickBestRoad(state, botPlayerId, roadSpots, difficulty);
}
