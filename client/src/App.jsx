import { useState, useEffect } from 'react';
import { SocketProvider } from './context/SocketContext';
import { GameProvider, useGame } from './context/GameContext';
import { AudioProvider } from './context/AudioContext';
import LobbyScreen from './screens/LobbyScreen';
import WaitingRoom from './screens/WaitingRoom';
import GameScreen from './screens/GameScreen';
import VictoryScreen from './screens/VictoryScreen';
import AdminDashboard, { isAdmin } from './screens/AdminDashboard';
import SettingsPanel from './components/common/SettingsPanel';
import SoundTriggers from './components/common/SoundTriggers';

const ADMIN_TOKEN_KEY = 'catan_admin_token';

// Handle one-time admin setup: visit ?admin-setup to activate admin on this browser
function handleAdminSetup() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('admin-setup')) {
    // Generate a random token and store it, then register with server
    fetch('/api/admin/setup', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
          window.history.replaceState({}, '', window.location.pathname);
          window.location.reload();
        }
      })
      .catch(() => {});
    return true;
  }
  return false;
}

function AppContent() {
  const { state } = useGame();
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    handleAdminSetup();
  }, []);

  if (showAdmin && isAdmin()) {
    return <AdminDashboard onBack={() => setShowAdmin(false)} />;
  }

  switch (state.screen) {
    case 'lobby':
      return <LobbyScreen onShowAdmin={() => setShowAdmin(true)} />;
    case 'waiting':
      return <WaitingRoom />;
    case 'playing':
      return <GameScreen />;
    case 'victory':
      return <VictoryScreen />;
    default:
      return <LobbyScreen onShowAdmin={() => setShowAdmin(true)} />;
  }
}

export default function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <AudioProvider>
          <AppContent />
          <SettingsPanel />
          <SoundTriggers />
        </AudioProvider>
      </GameProvider>
    </SocketProvider>
  );
}
