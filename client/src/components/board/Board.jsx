import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameActions } from '../../hooks/useGameActions';
import { getAllVertices, getAllEdges, vertexPixelPosition, edgeVertices, computeViewBox, getAdjacentVertices, getEdgesForVertex, hexPositionsForRadius } from 'shared/hexGeometry.js';
import HexTile from './HexTile';
import Vertex from './Vertex';
import Edge from './Edge';
import Robber from './Robber';
import Port from './Port';
import TerrainDefs from './TerrainDefs';
import './Board.css';

const HEX_SIZE = 60;

function getValidSettlementSpots(gameState, playerId, hexPositions) {
  const validVertices = getAllVertices(hexPositions);
  return validVertices.filter(vKey => {
    const vertex = gameState.board.vertices[vKey];
    if (vertex?.building) return false;
    // Distance rule
    const adjacent = getAdjacentVertices(vKey, hexPositions);
    if (adjacent.some(av => gameState.board.vertices[av]?.building)) return false;
    // Must connect to road network
    const edges = getEdgesForVertex(vKey, hexPositions);
    return edges.some(eKey => {
      const edge = gameState.board.edges[eKey];
      return edge?.ownerId === playerId;
    });
  });
}

function getValidCitySpots(gameState, playerId) {
  const player = gameState.players.find(p => p.id === playerId);
  return player?.settlements || [];
}

function getValidRoadSpots(gameState, playerId, hexPositions) {
  const allEdges = getAllEdges(hexPositions);
  return allEdges.filter(eKey => {
    const edge = gameState.board.edges[eKey];
    if (edge?.road) return false;
    const [v1, v2] = edgeVertices(eKey);
    return [v1, v2].some(v => {
      const vert = gameState.board.vertices[v];
      if (vert?.ownerId === playerId) return true;
      const adjEdges = getEdgesForVertex(v, hexPositions);
      return adjEdges.some(ae => {
        const adjEdge = gameState.board.edges[ae];
        return adjEdge?.ownerId === playerId;
      });
    });
  });
}

function getSetupSettlementSpots(gameState, hexPositions) {
  const validVertices = getAllVertices(hexPositions);
  return validVertices.filter(vKey => {
    const vertex = gameState.board.vertices[vKey];
    if (vertex?.building) return false;
    const adjacent = getAdjacentVertices(vKey, hexPositions);
    return !adjacent.some(av => gameState.board.vertices[av]?.building);
  });
}

function getSetupRoadSpots(gameState, playerId, hexPositions) {
  const player = gameState.players.find(p => p.id === playerId);
  const lastSettlement = player?.settlements[player.settlements.length - 1];
  if (!lastSettlement) return [];
  const edges = getEdgesForVertex(lastSettlement, hexPositions);
  return edges.filter(eKey => {
    const edge = gameState.board.edges[eKey];
    return !edge?.road;
  });
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.15;

export default function Board() {
  const { state } = useGame();
  const { gameState, pendingAction, playerId } = state;
  const actions = useGameActions();

  // Derive hex positions from board state
  const hexPositions = useMemo(() => {
    if (!gameState?.board) return null;
    const radius = gameState.board.boardRadius || 2;
    return hexPositionsForRadius(radius);
  }, [gameState?.board?.boardRadius]);

  // Zoom & pan state — use a target + lerp for smooth zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const targetZoom = useRef(1);
  const animFrameRef = useRef(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Smooth zoom animation loop
  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      setZoom(prev => {
        const diff = targetZoom.current - prev;
        if (Math.abs(diff) < 0.003) return targetZoom.current;
        return prev + diff * 0.18;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    targetZoom.current = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoom.current + delta));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 1 && e.button !== 0) return;
    if (e.button === 0 && !e.altKey && !e.shiftKey) return;
    e.preventDefault();
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Touch handlers for mobile pan/zoom
  const touchStartRef = useRef(null);
  const pinchStartDist = useRef(null);
  const pinchStartZoom = useRef(1);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy);
      pinchStartZoom.current = targetZoom.current;
      touchStartRef.current = null;
    } else if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panOrigin.current = { ...pan };
    }
  }, [pan]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchStartDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / pinchStartDist.current;
      targetZoom.current = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartZoom.current * scale));
    } else if (e.touches.length === 1 && touchStartRef.current && isPanning.current) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    pinchStartDist.current = null;
  }, []);

  const handleResetView = useCallback(() => {
    targetZoom.current = 1;
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  if (!gameState || !hexPositions) return null;

  const { board } = gameState;
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;
  const isSetup = gameState.phase === 'setup1' || gameState.phase === 'setup2';
  const needsSettlement = isSetup && !gameState.setupPlacedSettlement;
  const needsRoad = isSetup && gameState.setupPlacedSettlement;

  let clickableVertices = [];
  let clickableEdges = [];
  let clickableHexes = [];

  if (isMyTurn) {
    if (needsSettlement) {
      clickableVertices = getSetupSettlementSpots(gameState, hexPositions);
    } else if (needsRoad) {
      clickableEdges = getSetupRoadSpots(gameState, playerId, hexPositions);
    } else if (pendingAction === 'buildSettlement') {
      clickableVertices = getValidSettlementSpots(gameState, playerId, hexPositions);
    } else if (pendingAction === 'buildCity') {
      clickableVertices = getValidCitySpots(gameState, playerId);
    } else if (pendingAction === 'buildRoad' || gameState.phase === 'roadBuilding') {
      clickableEdges = getValidRoadSpots(gameState, playerId, hexPositions);
    } else if (gameState.phase === 'robber') {
      clickableHexes = board.hexes
        .filter(h => !(h.q === board.robberHex.q && h.r === board.robberHex.r))
        .map(h => `${h.q},${h.r}`);
    }
  }

  const vb = computeViewBox(HEX_SIZE, 50, hexPositions);

  const handleVertexClick = (vKey) => {
    if (needsSettlement) {
      actions.placeInitialSettlement(vKey);
    } else if (pendingAction === 'buildSettlement') {
      actions.buildSettlement(vKey);
    } else if (pendingAction === 'buildCity') {
      actions.buildCity(vKey);
    }
  };

  const handleEdgeClick = (eKey) => {
    if (needsRoad) {
      actions.placeInitialRoad(eKey);
    } else {
      actions.buildRoad(eKey);
    }
  };

  const handleHexClick = (hex) => {
    if (gameState.phase === 'robber' && isMyTurn) {
      actions.moveRobber(hex.q, hex.r);
    }
  };

  const svgStyle = {
    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
    cursor: isPanning.current ? 'grabbing' : 'default',
  };

  return (
    <div
      className="board-container"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
        className="board-svg"
        style={svgStyle}
      >
        <TerrainDefs />

        {/* Ocean background */}
        <rect
          x={vb.x} y={vb.y}
          width={vb.width} height={vb.height}
          fill="url(#ocean-bg)"
        />
        <rect
          x={vb.x} y={vb.y}
          width={vb.width} height={vb.height}
          fill="url(#ocean-pattern)"
          opacity="0.6"
        />

        {/* Hex tiles */}
        {board.hexes.map(hex => (
          <HexTile
            key={`${hex.q},${hex.r}`}
            hex={hex}
            size={HEX_SIZE}
            clickable={clickableHexes.includes(`${hex.q},${hex.r}`)}
            onClick={() => handleHexClick(hex)}
          />
        ))}

        {/* Ports */}
        {board.ports.map((port, i) => (
          <Port key={i} port={port} size={HEX_SIZE} />
        ))}

        {/* Edges/Roads */}
        {getAllEdges(hexPositions).map(eKey => {
          const [v1, v2] = edgeVertices(eKey);
          const p1 = vertexPixelPosition(v1, HEX_SIZE);
          const p2 = vertexPixelPosition(v2, HEX_SIZE);
          const edgeData = board.edges[eKey];
          const isClickable = clickableEdges.includes(eKey);

          if (!edgeData?.road && !isClickable) return null;

          return (
            <Edge
              key={eKey}
              edgeKey={eKey}
              p1={p1}
              p2={p2}
              owner={edgeData?.owner}
              clickable={isClickable}
              onClick={() => handleEdgeClick(eKey)}
            />
          );
        })}

        {/* Vertices/Buildings */}
        {getAllVertices(hexPositions).map(vKey => {
          const pos = vertexPixelPosition(vKey, HEX_SIZE);
          const vertexData = board.vertices[vKey];
          const isClickable = clickableVertices.includes(vKey);

          if (!vertexData?.building && !isClickable) return null;

          return (
            <Vertex
              key={vKey}
              vertexKey={vKey}
              pos={pos}
              building={vertexData?.building}
              owner={vertexData?.owner}
              clickable={isClickable}
              onClick={() => handleVertexClick(vKey)}
            />
          );
        })}

        {/* Robber */}
        <Robber hex={board.robberHex} size={HEX_SIZE} />
      </svg>

      {/* Zoom controls */}
      <div className="board-zoom-controls">
        <button className="zoom-btn" onClick={() => { targetZoom.current = Math.min(MAX_ZOOM, targetZoom.current + ZOOM_STEP); }} title="Zoom in">+</button>
        <button className="zoom-btn" onClick={handleResetView} title="Reset view">⟲</button>
        <button className="zoom-btn" onClick={() => { targetZoom.current = Math.max(MIN_ZOOM, targetZoom.current - ZOOM_STEP); }} title="Zoom out">−</button>
      </div>

      {/* Phase instruction overlay */}
      <div className="board-instruction">
        {isMyTurn && needsSettlement && 'Place a settlement'}
        {isMyTurn && needsRoad && 'Place a road'}
        {isMyTurn && gameState.phase === 'robber' && 'Move the robber'}
        {isMyTurn && gameState.phase === 'steal' && 'Select a player to steal from'}
        {isMyTurn && gameState.phase === 'roadBuilding' && `Place a road (${gameState.roadBuildingRemaining} left)`}
        {!isMyTurn && gameState.phase !== 'discard' && `${gameState.players[gameState.currentPlayerIndex]?.name}'s turn`}
      </div>
    </div>
  );
}
