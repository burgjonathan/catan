// Procedural sound effects using Web Audio API — no external files needed

let ctx = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noise(duration, volume = 0.3) {
  const c = getCtx();
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * volume;
  return buf;
}

function playBuf(buf, when = 0) {
  const c = getCtx();
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.start(c.currentTime + when);
  return src;
}

// --- Individual sound effects ---

export function playDiceRoll() {
  const c = getCtx();
  const now = c.currentTime;

  // Rattling noise bursts
  for (let i = 0; i < 6; i++) {
    const buf = noise(0.04, 0.15);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800 + Math.random() * 2000;
    filter.Q.value = 2;
    const gain = c.createGain();
    gain.gain.value = 0.3;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(now + i * 0.06);
  }

  // Landing thud
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, now + 0.4);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.55);
  const g = c.createGain();
  g.gain.setValueAtTime(0.4, now + 0.4);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc.connect(g).connect(c.destination);
  osc.start(now + 0.4);
  osc.stop(now + 0.65);
}

export function playBuildSettlement() {
  const c = getCtx();
  const now = c.currentTime;
  // Three hammer hits
  for (let i = 0; i < 3; i++) {
    const t = now + i * 0.12;
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600 - i * 80, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
    const g = c.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }
  // Completion chime
  const osc2 = c.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 880;
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.15, now + 0.4);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  osc2.connect(g2).connect(c.destination);
  osc2.start(now + 0.4);
  osc2.stop(now + 0.75);
}

export function playBuildCity() {
  const c = getCtx();
  const now = c.currentTime;
  // Deeper construction sounds
  for (let i = 0; i < 4; i++) {
    const t = now + i * 0.1;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400 - i * 50, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    const g = c.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }
  // Majestic chord
  [523, 659, 784].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.1, now + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(g).connect(c.destination);
    osc.start(now + 0.5 + i * 0.05);
    osc.stop(now + 1.05);
  });
}

export function playBuildRoad() {
  const c = getCtx();
  const now = c.currentTime;
  // Light taps
  for (let i = 0; i < 2; i++) {
    const t = now + i * 0.1;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.06);
    const g = c.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }
}

export function playResourceGain() {
  const c = getCtx();
  const now = c.currentTime;
  // Rising chime
  [660, 880, 1100].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = c.createGain();
    const t = now + i * 0.08;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

export function playTradeOffer() {
  const c = getCtx();
  const now = c.currentTime;
  // Notification bell
  [1047, 1319].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.15, now + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
    osc.connect(g).connect(c.destination);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.35);
  });
}

export function playTradeComplete() {
  const c = getCtx();
  const now = c.currentTime;
  // Cash register cha-ching
  const buf = noise(0.03, 0.2);
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 4000;
  src.connect(hp).connect(c.destination);
  src.start(now);
  // Positive tones
  [1318, 1568, 2093].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.12, now + 0.05 + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05 + i * 0.06 + 0.25);
    osc.connect(g).connect(c.destination);
    osc.start(now + 0.05 + i * 0.06);
    osc.stop(now + 0.35);
  });
}

export function playRobber() {
  const c = getCtx();
  const now = c.currentTime;
  // Ominous low rumble
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.linearRampToValueAtTime(50, now + 0.5);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;
  const g = c.createGain();
  g.gain.setValueAtTime(0.2, now);
  g.gain.linearRampToValueAtTime(0.3, now + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc.connect(filter).connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.65);
  // Dramatic stinger
  const osc2 = c.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 220;
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0, now + 0.1);
  g2.gain.linearRampToValueAtTime(0.15, now + 0.2);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc2.connect(g2).connect(c.destination);
  osc2.start(now + 0.1);
  osc2.stop(now + 0.65);
}

export function playDevCard() {
  const c = getCtx();
  const now = c.currentTime;
  // Magical swirl
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);
  const g = c.createGain();
  g.gain.setValueAtTime(0.15, now);
  g.gain.linearRampToValueAtTime(0.2, now + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.6);
  // Shimmer
  const osc2 = c.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(2000, now + 0.1);
  osc2.frequency.exponentialRampToValueAtTime(800, now + 0.5);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.06, now + 0.1);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc2.connect(g2).connect(c.destination);
  osc2.start(now + 0.1);
  osc2.stop(now + 0.55);
}

export function playVictory() {
  const c = getCtx();
  const now = c.currentTime;
  // Triumphant fanfare - ascending major chord arpeggios
  const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = i < 4 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    const g = c.createGain();
    const t = now + i * 0.12;
    g.gain.setValueAtTime(0.18, t);
    g.gain.setValueAtTime(0.18, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  });
  // Final sustained chord
  [1047, 1319, 1568].forEach(freq => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.15, now + 1.0);
    g.gain.linearRampToValueAtTime(0.2, now + 1.3);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
    osc.connect(g).connect(c.destination);
    osc.start(now + 1.0);
    osc.stop(now + 2.3);
  });
}

export function playChatMessage() {
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1200;
  const g = c.createGain();
  g.gain.setValueAtTime(0.1, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

export function playYourTurn() {
  const c = getCtx();
  const now = c.currentTime;
  // Alert chime - two bright notes
  [880, 1175].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = c.createGain();
    const t = now + i * 0.2;
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

export function playError() {
  const c = getCtx();
  const now = c.currentTime;
  // Buzzer
  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 150;
  const g = c.createGain();
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

export function playButtonClick() {
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 900;
  const g = c.createGain();
  g.gain.setValueAtTime(0.08, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.06);
}

export function playPlayerJoin() {
  const c = getCtx();
  const now = c.currentTime;
  [440, 554, 659].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = c.createGain();
    const t = now + i * 0.1;
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

export function playDiscard() {
  const c = getCtx();
  const now = c.currentTime;
  // Warning descending tones
  [600, 450, 350].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = c.createGain();
    const t = now + i * 0.12;
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}
