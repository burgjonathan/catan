import { useState, useEffect, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { useGameActions } from '../hooks/useGameActions';
import { useGame } from '../context/GameContext';
import { C2S, S2C } from 'shared/protocol.js';
import './RoomBrowser.css';

export default function RoomBrowser({ playerName, onBack }) {
  const [rooms, setRooms] = useState(null);
  const [joining, setJoining] = useState(null);
  const autoCreated = useRef(false);
  const { socket } = useSocketContext();
  const actions = useGameActions();
  const { state } = useGame();

  useEffect(() => {
    if (!socket) return;

    socket.emit(C2S.BROWSE_ROOMS);

    const handleRoomList = ({ rooms }) => {
      setRooms(rooms);
      // Auto-create a public room if none exist
      if (rooms.length === 0 && !autoCreated.current) {
        autoCreated.current = true;
        actions.quickPlay(playerName);
      }
    };
    const handleReconnect = () => socket.emit(C2S.BROWSE_ROOMS);

    socket.on(S2C.PUBLIC_ROOM_LIST, handleRoomList);
    socket.on('connect', handleReconnect);

    return () => {
      socket.emit(C2S.STOP_BROWSING);
      socket.off(S2C.PUBLIC_ROOM_LIST, handleRoomList);
      socket.off('connect', handleReconnect);
    };
  }, [socket]);

  const handleJoin = (code) => {
    setJoining(code);
    actions.joinRoom(code, playerName);
  };

  const handleQuickPlay = () => {
    actions.quickPlay(playerName);
  };

  return (
    <div className="browser-screen">
      <div className="browser-container">
        <h2 className="browser-title">Public Games</h2>

        {state.error && <div className="lobby-error">{state.error}</div>}

        <div className="browser-actions">
          <button className="btn btn-primary browser-quick-play" onClick={handleQuickPlay}>
            Quick Play
          </button>
          <button className="btn btn-secondary browser-back-btn" onClick={onBack}>
            Back
          </button>
        </div>

        <div className="room-list">
          {rooms === null ? (
            <div className="no-rooms">Finding games...</div>
          ) : rooms.length === 0 ? (
            <div className="no-rooms">Creating a new game...</div>
          ) : (
            rooms.map(room => (
              <div key={room.code} className="room-card">
                <div className="room-status">
                  <span className="room-players-label">
                    {room.playerCount}/4 Players
                  </span>
                  <span className="room-waiting">
                    Waiting for {4 - room.playerCount} more...
                  </span>
                </div>
                <div className="room-meta">
                  <div className="room-players-bar">
                    <div
                      className="room-players-fill"
                      style={{ width: `${(room.playerCount / room.maxPlayers) * 100}%` }}
                    />
                  </div>
                  <button
                    className="btn btn-primary room-join-btn"
                    onClick={() => handleJoin(room.code)}
                    disabled={joining === room.code}
                  >
                    {joining === room.code ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
