import { useState, useEffect } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { useGameActions } from '../hooks/useGameActions';
import { useGame } from '../context/GameContext';
import { C2S, S2C } from 'shared/protocol.js';
import './RoomBrowser.css';

export default function RoomBrowser({ playerName, onBack }) {
  const [rooms, setRooms] = useState([]);
  const [joining, setJoining] = useState(null);
  const { socket } = useSocketContext();
  const actions = useGameActions();
  const { state } = useGame();

  useEffect(() => {
    if (!socket) return;

    socket.emit(C2S.BROWSE_ROOMS);

    const handleRoomList = ({ rooms }) => setRooms(rooms);
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
          {rooms.length === 0 ? (
            <div className="no-rooms">
              No public games available. Click Quick Play to start one!
            </div>
          ) : (
            rooms.map(room => (
              <div key={room.code} className="room-card">
                <div className="room-info">
                  <span className="room-name">{room.name}</span>
                  <span className="room-host">Host: {room.hostName}</span>
                </div>
                <div className="room-meta">
                  <div className="room-players-bar">
                    <div
                      className="room-players-fill"
                      style={{ width: `${(room.playerCount / room.maxPlayers) * 100}%` }}
                    />
                  </div>
                  <span className="room-players-count">{room.playerCount}/{room.maxPlayers}</span>
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
