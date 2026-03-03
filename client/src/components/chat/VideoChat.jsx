import { useGame } from '../../context/GameContext';
import { useWebRTC } from '../../hooks/useWebRTC';
import VideoTile from './VideoTile';
import './VideoChat.css';

export default function VideoChat() {
  const { state } = useGame();
  const { gameState, playerId, players } = state;
  const allPlayers = gameState?.players || players || [];

  const { streams, localStream, muted, videoOff, toggleMute, toggleVideo, startMedia, mediaStarted } = useWebRTC(
    allPlayers,
    playerId
  );

  return (
    <div className="video-chat">
      <div className="video-header">
        <span>Video Chat</span>
        {!mediaStarted && (
          <button className="btn-join-call" onClick={startMedia}>
            Join Call
          </button>
        )}
      </div>
      <div className="video-grid">
        <VideoTile
          stream={localStream}
          name="You"
          muted={true}
          isLocal={true}
        />
        {allPlayers
          .filter(p => p.id !== playerId)
          .map(p => (
            <VideoTile
              key={p.id}
              stream={streams[p.id]}
              name={p.name}
              color={p.color}
            />
          ))}
      </div>
      <div className="video-controls">
        <button
          className={`video-ctrl-btn ${muted ? 'off' : ''}`}
          onClick={mediaStarted ? toggleMute : startMedia}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🎤'}
        </button>
        <button
          className={`video-ctrl-btn ${videoOff ? 'off' : ''}`}
          onClick={mediaStarted ? toggleVideo : startMedia}
          title={videoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {videoOff ? '📷' : '📹'}
        </button>
      </div>
    </div>
  );
}
