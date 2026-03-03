// Procedural ambient background music using Web Audio API
// Medieval/seafaring vibe with gentle arpeggios and pads

let ctx = null;
let masterGain = null;
let isPlaying = false;
let schedulerId = null;
let nextNoteTime = 0;
let currentChordIndex = 0;
let nodes = [];

// Chords: Am - F - C - G (medieval-sounding progression)
const CHORDS = [
  [220, 262, 330],     // Am: A3, C4, E4
  [175, 220, 262],     // F:  F3, A3, C4
  [262, 330, 392],     // C:  C4, E4, G4
  [196, 247, 294],     // G:  G3, B3, D4
  [220, 262, 330],     // Am
  [175, 220, 262],     // F
  [262, 330, 392],     // C
  [247, 294, 370],     // Em/B: B3, D4, F#4
];

const BASS_NOTES = [110, 87.3, 131, 98, 110, 87.3, 131, 123.5];
const TEMPO = 80; // BPM
const BEAT_LEN = 60 / TEMPO;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

function createPad(freq, startTime, duration) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const osc2 = c.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = freq * 1.002; // Slight detune for warmth

  const g = c.createGain();
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(0.03, startTime + duration * 0.3);
  g.gain.setValueAtTime(0.03, startTime + duration * 0.6);
  g.gain.linearRampToValueAtTime(0, startTime + duration);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 1;

  osc.connect(g);
  osc2.connect(g);
  g.connect(filter).connect(masterGain);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
  osc2.start(startTime);
  osc2.stop(startTime + duration + 0.1);

  nodes.push(osc, osc2);
}

function createArpNote(freq, startTime, duration) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq * 2; // One octave up

  const g = c.createGain();
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(0.04, startTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(g).connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);

  nodes.push(osc);
}

function createBass(freq, startTime, duration) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const g = c.createGain();
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(0.06, startTime + 0.05);
  g.gain.setValueAtTime(0.06, startTime + duration * 0.7);
  g.gain.linearRampToValueAtTime(0, startTime + duration);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 300;

  osc.connect(g).connect(filter).connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);

  nodes.push(osc);
}

function scheduleBar() {
  const c = getCtx();
  const chord = CHORDS[currentChordIndex % CHORDS.length];
  const bass = BASS_NOTES[currentChordIndex % BASS_NOTES.length];
  const barDuration = BEAT_LEN * 4;

  // Pad chord (whole bar)
  chord.forEach(freq => {
    createPad(freq, nextNoteTime, barDuration);
  });

  // Bass note (whole bar)
  createBass(bass, nextNoteTime, barDuration);

  // Arpeggio pattern (8th notes)
  const arpPattern = [0, 1, 2, 1, 0, 2, 1, 2];
  arpPattern.forEach((noteIdx, i) => {
    const t = nextNoteTime + i * (BEAT_LEN / 2);
    createArpNote(chord[noteIdx], t, BEAT_LEN / 2 - 0.02);
  });

  nextNoteTime += barDuration;
  currentChordIndex = (currentChordIndex + 1) % CHORDS.length;
}

function scheduler() {
  const c = getCtx();
  // Schedule ahead 2 bars
  while (nextNoteTime < c.currentTime + BEAT_LEN * 8) {
    scheduleBar();
  }
}

export function startMusic() {
  if (isPlaying) return;
  const c = getCtx();
  if (c.state === 'suspended') c.resume();

  if (!masterGain) {
    masterGain = c.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(c.destination);
  }

  isPlaying = true;
  nextNoteTime = c.currentTime + 0.1;
  currentChordIndex = 0;

  scheduler();
  schedulerId = setInterval(scheduler, 200);
}

export function stopMusic() {
  if (!isPlaying) return;
  isPlaying = false;
  if (schedulerId) {
    clearInterval(schedulerId);
    schedulerId = null;
  }
  // Stop all scheduled nodes
  nodes.forEach(n => {
    try { n.stop(); } catch {}
  });
  nodes = [];
}

export function setMusicVolume(vol) {
  if (masterGain) {
    masterGain.gain.value = vol;
  }
}

export function isMusicPlaying() {
  return isPlaying;
}
