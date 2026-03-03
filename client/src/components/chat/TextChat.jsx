import { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameActions } from '../../hooks/useGameActions';
import './TextChat.css';

export default function TextChat() {
  const { state } = useGame();
  const actions = useGameActions();
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);

  const messages = [
    ...(state.gameState?.gameLog || []).map(m => ({ ...m, isLog: true })),
    ...state.chatMessages.map(m => ({ ...m, isLog: false }))
  ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    actions.sendChat(message.trim());
    setMessage('');
  };

  return (
    <div className="text-chat">
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.isLog ? 'log-msg' : 'player-msg'}`}>
            {!msg.isLog && (
              <span className="chat-author" style={{ color: msg.color }}>{msg.from}: </span>
            )}
            <span className="chat-text">{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          maxLength={200}
        />
        <button onClick={handleSend} disabled={!message.trim()}>Send</button>
      </div>
    </div>
  );
}
