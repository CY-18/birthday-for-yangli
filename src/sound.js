const BEAT_SECONDS = 0.55;

const MELODY = [
  [392, 0.5],
  [392, 0.5],
  [440, 1],
  [392, 1],
  [523.25, 1],
  [493.88, 2],
  [392, 0.5],
  [392, 0.5],
  [440, 1],
  [392, 1],
  [587.33, 1],
  [523.25, 2],
  [392, 0.5],
  [392, 0.5],
  [783.99, 1],
  [659.25, 1],
  [523.25, 1],
  [493.88, 1],
  [440, 2],
  [698.46, 0.5],
  [698.46, 0.5],
  [659.25, 1],
  [523.25, 1],
  [587.33, 1],
  [523.25, 2],
];

const ACCOMPANIMENT = [
  { beat: 0, bass: 130.81, chord: [164.81, 196, 246.94] },
  { beat: 3, bass: 98, chord: [146.83, 174.61, 246.94] },
  { beat: 6, bass: 130.81, chord: [164.81, 196, 246.94] },
  { beat: 9, bass: 98, chord: [146.83, 174.61, 246.94] },
  { beat: 12, bass: 130.81, chord: [164.81, 196, 246.94] },
  { beat: 15, bass: 164.81, chord: [196, 246.94, 293.66] },
  { beat: 18, bass: 174.61, chord: [220, 261.63, 329.63] },
  { beat: 21, bass: 98, chord: [146.83, 174.61, 246.94] },
  { beat: 23, bass: 130.81, chord: [164.81, 196, 246.94] },
];

export function createBirthdayMusicPlayer(options = {}) {
  const AudioContextClass =
    options.AudioContextClass ??
    globalThis.AudioContext ??
    globalThis.webkitAudioContext;
  let context;
  const activeOscillators = new Set();

  const ensureContext = () => {
    if (!AudioContextClass) return undefined;
    context ??= new AudioContextClass();
    return context;
  };

  const scheduleTone = ({
    frequency,
    start,
    duration,
    type,
    volume,
  }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const end = start + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.connect(gain);
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.start(start);
    oscillator.stop(end + 0.03);
    oscillator.onended = () => activeOscillators.delete(oscillator);
    activeOscillators.add(oscillator);
  };

  const stop = () => {
    if (!context) return;

    activeOscillators.forEach((oscillator) => {
      try {
        oscillator.stop(context.currentTime + 0.03);
      } catch {
        // The oscillator may already have ended.
      }
    });
    activeOscillators.clear();
  };

  return {
    prepare() {
      const audioContext = ensureContext();
      if (audioContext?.state === "suspended") {
        void audioContext.resume();
      }
    },

    play(enabled) {
      if (!enabled) return;

      const audioContext = ensureContext();
      if (!audioContext) return;
      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      stop();
      const start = audioContext.currentTime + 0.06;
      let beat = 0;

      MELODY.forEach(([frequency, beats]) => {
        const noteStart = start + beat * BEAT_SECONDS;
        const duration = beats * BEAT_SECONDS * 0.92;

        scheduleTone({
          frequency,
          start: noteStart,
          duration,
          type: "triangle",
          volume: 0.065,
        });
        scheduleTone({
          frequency: frequency * 2.01,
          start: noteStart,
          duration: duration * 0.72,
          type: "sine",
          volume: 0.014,
        });
        beat += beats;
      });

      ACCOMPANIMENT.forEach(({ beat: chordBeat, bass, chord }) => {
        const chordStart = start + chordBeat * BEAT_SECONDS;
        const duration = 2.8 * BEAT_SECONDS;

        scheduleTone({
          frequency: bass,
          start: chordStart,
          duration,
          type: "sine",
          volume: 0.032,
        });
        chord.forEach((frequency) => {
          scheduleTone({
            frequency,
            start: chordStart,
            duration,
            type: "triangle",
            volume: 0.012,
          });
        });
      });
    },

    stop,

    destroy() {
      stop();
      void context?.close();
      context = undefined;
    },
  };
}
