export class BlowGate {
  constructor({ threshold, holdMs }) {
    this.threshold = threshold;
    this.holdMs = holdMs;
    this.aboveMs = 0;
    this.triggered = false;
  }

  push(level, deltaMs) {
    if (this.triggered) return false;

    this.aboveMs = level >= this.threshold ? this.aboveMs + deltaMs : 0;
    if (this.aboveMs < this.holdMs) return false;

    this.triggered = true;
    return true;
  }
}

export function createBlowDetector(onBlow) {
  let stream;
  let context;
  let frame;

  return {
    async start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is unavailable");
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: true,
          noiseSuppression: false,
        },
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      context = new AudioContextClass();

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const values = new Uint8Array(analyser.fftSize);
      const gate = new BlowGate({ threshold: 0.12, holdMs: 180 });
      let previous = performance.now();

      const tick = (now) => {
        analyser.getByteTimeDomainData(values);
        const energy = values.reduce((sum, value) => {
          const sample = (value - 128) / 128;
          return sum + sample * sample;
        }, 0);

        if (gate.push(Math.sqrt(energy / values.length), now - previous)) {
          onBlow();
        }

        previous = now;
        frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    },

    stop() {
      if (frame) cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      void context?.close();
    },
  };
}
