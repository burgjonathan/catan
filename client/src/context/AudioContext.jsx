import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { startMusic, stopMusic, setMusicVolume } from '../audio/musicEngine';
import * as sfx from '../audio/soundEngine';

const AudioContext_ = createContext(null);

export function AudioProvider({ children }) {
  const [musicOn, setMusicOn] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const [musicVolume, setMusicVolumeState] = useState(0.5);
  const [chatMessagesMuted, setChatMessagesMuted] = useState(false);
  const sfxOnRef = useRef(sfxOn);

  useEffect(() => { sfxOnRef.current = sfxOn; }, [sfxOn]);

  // Music toggle
  const toggleMusic = useCallback(() => {
    setMusicOn(prev => {
      if (!prev) {
        startMusic();
      } else {
        stopMusic();
      }
      return !prev;
    });
  }, []);

  // SFX toggle
  const toggleSfx = useCallback(() => {
    setSfxOn(prev => !prev);
  }, []);

  // Volume control
  const changeMusicVolume = useCallback((vol) => {
    setMusicVolumeState(vol);
    setMusicVolume(vol);
  }, []);

  // Chat messages mute toggle
  const toggleChatMessagesMute = useCallback(() => {
    setChatMessagesMuted(prev => !prev);
  }, []);

  // Play a sound effect (respects sfxOn setting)
  const playSfx = useCallback((soundName) => {
    if (!sfxOnRef.current) return;
    const soundMap = {
      diceRoll: sfx.playDiceRoll,
      buildSettlement: sfx.playBuildSettlement,
      buildCity: sfx.playBuildCity,
      buildRoad: sfx.playBuildRoad,
      resourceGain: sfx.playResourceGain,
      tradeOffer: sfx.playTradeOffer,
      tradeComplete: sfx.playTradeComplete,
      robber: sfx.playRobber,
      devCard: sfx.playDevCard,
      victory: sfx.playVictory,
      chatMessage: sfx.playChatMessage,
      yourTurn: sfx.playYourTurn,
      error: sfx.playError,
      buttonClick: sfx.playButtonClick,
      playerJoin: sfx.playPlayerJoin,
      discard: sfx.playDiscard,
    };
    const fn = soundMap[soundName];
    if (fn) fn();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMusic();
  }, []);

  return (
    <AudioContext_.Provider value={{
      musicOn,
      sfxOn,
      musicVolume,
      toggleMusic,
      toggleSfx,
      changeMusicVolume,
      playSfx,
      chatMessagesMuted,
      toggleChatMessagesMute,
    }}>
      {children}
    </AudioContext_.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext_);
}
