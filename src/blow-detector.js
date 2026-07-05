export class BlowGate {
  constructor({ threshold, holdMs, releaseMs = 80 }) {
    this.threshold = threshold;
    this.holdMs = holdMs;
    this.releaseMs = releaseMs;
    this.aboveMs = 0;
    this.quietMs = 0;
    this.triggered = false;
  }

  push(level, deltaMs) {
    if (this.triggered) return false;

    if (level >= this.threshold) {
      this.aboveMs += deltaMs;
      this.quietMs = 0;
    } else {
      this.quietMs += deltaMs;
      if (this.quietMs >= this.releaseMs) {
        this.aboveMs = 0;
      }
    }

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

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Web Audio is unavailable");
      }

      context = new AudioContextClass();
      if (context.state === "suspended") {
        await context.resume();
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
          },
        });
      } catch (error) {
        void context.close();
        throw error;
      }

      if (context.state === "suspended") {
        await context.resume();
      }

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const useFloatSamples =
        typeof analyser.getFloatTimeDomainData === "function";
      const values = useFloatSamples
        ? new Float32Array(analyser.fftSize)
        : new Uint8Array(analyser.fftSize);
      const gate = new BlowGate({
        threshold: 0.01,
        holdMs: 100,
        releaseMs: 80,
      });
      let previous = performance.now();

      const tick = (now) => {
        if (useFloatSamples) {
          analyser.getFloatTimeDomainData(values);
        } else {
          analyser.getByteTimeDomainData(values);
        }

        const energy = values.reduce((sum, value) => {
          const sample = useFloatSamples ? value : (value - 128) / 128;
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
