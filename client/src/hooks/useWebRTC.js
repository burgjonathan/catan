import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { C2S, S2C } from 'shared/protocol.js';

export function useWebRTC(roomPlayers, myId) {
  const { socket } = useSocketContext();
  const [streams, setStreams] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [mediaStarted, setMediaStarted] = useState(false);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const startMedia = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    let stream = null;

    // Try video + audio
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' }
      });
    } catch (err) {
      console.warn('Video+audio failed:', err.message);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (err2) {
        console.warn('Audio-only failed:', err2.message);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        } catch (err3) {
          console.warn('No media devices:', err3.message);
          return null;
        }
      }
    }

    if (stream) {
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaStarted(true);
      setVideoOff(stream.getVideoTracks().length === 0);
      setMuted(false);
    }

    return stream;
  }, []);

  // Peer connections effect
  useEffect(() => {
    if (!socket || !roomPlayers || roomPlayers.length < 2 || !myId) return;

    const otherPlayers = roomPlayers.filter(p => p.id !== myId);
    if (otherPlayers.length === 0) return;

    let cancelled = false;

    function createPeerConnection(peerId, stream, shouldOffer) {
      if (peersRef.current[peerId]) return peersRef.current[peerId];

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });
      peersRef.current[peerId] = pc;

      if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate && socketRef.current) {
          socketRef.current.emit(C2S.SIGNAL_ICE, { targetId: peerId, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        if (e.streams?.[0]) {
          setStreams(prev => ({ ...prev, [peerId]: e.streams[0] }));
        }
      };

      if (shouldOffer && myId > peerId) {
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socketRef.current?.emit(C2S.SIGNAL_OFFER, {
              targetId: peerId,
              offer: pc.localDescription
            });
          })
          .catch(err => console.warn('Offer failed:', err));
      }

      return pc;
    }

    async function setupConnections() {
      const stream = localStreamRef.current;
      // Don't auto-request media - user clicks "Join Call"
      if (cancelled || !stream) return;

      for (const player of otherPlayers) {
        if (peersRef.current[player.id]) continue;
        createPeerConnection(player.id, stream, true);
      }
    }

    const handleOffer = async ({ fromId, offer }) => {
      const stream = localStreamRef.current;
      let pc = peersRef.current[fromId];
      if (!pc) {
        pc = createPeerConnection(fromId, stream, false);
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit(C2S.SIGNAL_ANSWER, {
          targetId: fromId,
          answer: pc.localDescription
        });
      } catch (err) {
        console.warn('Handle offer failed:', err);
      }
    };

    const handleAnswer = async ({ fromId, answer }) => {
      const pc = peersRef.current[fromId];
      if (pc && pc.signalingState === 'have-local-offer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.warn('Handle answer failed:', err);
        }
      }
    };

    const handleIce = async ({ fromId, candidate }) => {
      const pc = peersRef.current[fromId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('ICE failed:', err);
        }
      }
    };

    socket.on(S2C.SIGNAL_OFFER, handleOffer);
    socket.on(S2C.SIGNAL_ANSWER, handleAnswer);
    socket.on(S2C.SIGNAL_ICE, handleIce);

    setupConnections();

    return () => {
      cancelled = true;
      socket.off(S2C.SIGNAL_OFFER, handleOffer);
      socket.off(S2C.SIGNAL_ANSWER, handleAnswer);
      socket.off(S2C.SIGNAL_ICE, handleIce);
      Object.values(peersRef.current).forEach(pc => {
        try { pc.close(); } catch {}
      });
      peersRef.current = {};
      setStreams({});
    };
  }, [socket, roomPlayers?.length, myId, mediaStarted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;
    // If currently enabled -> disable (mute). If currently disabled -> enable (unmute).
    const isCurrentlyOn = audioTracks[0].enabled;
    audioTracks.forEach(t => { t.enabled = !isCurrentlyOn; });
    setMuted(isCurrentlyOn); // muted = true means we just turned it off
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;
    const isCurrentlyOn = videoTracks[0].enabled;
    videoTracks.forEach(t => { t.enabled = !isCurrentlyOn; });
    setVideoOff(isCurrentlyOn); // videoOff = true means we just turned it off
  }, []);

  return { streams, localStream, muted, videoOff, toggleMute, toggleVideo, startMedia, mediaStarted };
}
