// Gobble Dash — synthesized sound effects.
// One clear job: every beep, gobble and thud, made with WebAudio alone.
// No audio files, no network: the game stays a pile of static files.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, lowpass) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 900;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t0);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    jump() {
      tone(420, 0.14, 'square', 0.1, 760);
    },
    flap() {
      tone(520, 0.1, 'triangle', 0.09, 880);
    },
    pickup() {
      tone(880, 0.09, 'sine', 0.14, 1320);
    },
    pie() {
      tone(660, 0.12, 'sine', 0.14, 990);
      setTimeout(() => tone(990, 0.16, 'sine', 0.14, 1480), 90);
    },
    hit() {
      noise(0.22, 0.25, 500);
      tone(140, 0.25, 'sawtooth', 0.16, 60);
    },
    alarm() {
      tone(620, 0.12, 'square', 0.08, 620);
      setTimeout(() => tone(470, 0.12, 'square', 0.08, 470), 130);
    },
    gobble() {
      // A turkey says hello: four descending clucks.
      const notes = [340, 300, 260, 220];
      notes.forEach((f, i) => setTimeout(() => tone(f, 0.09, 'square', 0.12, f * 0.8), i * 95));
    },
    fanfare() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.14), i * 130));
    },
    caught() {
      const notes = [392, 330, 262, 196];
      notes.forEach((f, i) => setTimeout(() => tone(f, 0.28, 'sawtooth', 0.12), i * 170));
    },
  };
}
