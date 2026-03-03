import { SocketProvider } from './context/SocketContext';
import { GameProvider, useGame } from './context/GameContext';
import { AudioProvider } from './context/AudioContext';
import LobbyScreen from './screens/LobbyScreen';
import WaitingRoom from './screens/WaitingRoom';
import GameScreen from './screens/GameScreen';
import VictoryScreen from './screens/VictoryScreen';
import AudioControls from './components/common/AudioControls';
import SoundTriggers from './components/common/SoundTriggers';

function AppContent() {
  const { state } = useGame();

  switch (state.screen) {
    case 'lobby':
      return <LobbyScreen />;
    case 'waiting':
      return <WaitingRoom />;
    case 'playing':
      return <GameScreen />;
    case 'victory':
      return <VictoryScreen />;
    default:
      return <LobbyScreen />;
  }
}

export default function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <AudioProvider>
          <AppContent />
          <AudioControls />
          <SoundTriggers />
        </AudioProvider>
      </GameProvider>
    </SocketProvider>
  );
}
