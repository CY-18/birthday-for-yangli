import { afterEach, describe, expect, it, vi } from "vitest";
import { BlowGate, createBlowDetector } from "./blow-detector";

function installAudioMocks({
  byteSample = 128,
  contextState = "running",
  floatSample = 0,
} = {}) {
  let scheduledFrame;
  const resume = vi.fn().mockResolvedValue();
  const close = vi.fn().mockResolvedValue();
  const stopTrack = vi.fn();
  const analyser = {
    fftSize: 0,
    getByteTimeDomainData: vi.fn((values) => values.fill(byteSample)),
    getFloatTimeDomainData: vi.fn((values) => values.fill(floatSample)),
  };
  const getUserMedia = vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: stopTrack }],
  });

  class FakeAudioContext {
    state = contextState;
    resume = resume;
    close = close;
    createMediaStreamSource() {
      return { connect: vi.fn() };
    }
    createAnalyser() {
      return analyser;
    }
  }

  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia,
    },
  });
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback) => {
      scheduledFrame = callback;
      return 1;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());

  return {
    analyser,
    getUserMedia,
    resume,
    runFrame(now) {
      scheduledFrame(now);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BlowGate", () => {
  it("triggers once after sustained loud input", () => {
    const gate = new BlowGate({ threshold: 0.12, holdMs: 180 });

    expect(gate.push(0.2, 80)).toBe(false);
    expect(gate.push(0.2, 100)).toBe(true);
    expect(gate.push(0.3, 200)).toBe(false);
  });

  it("tolerates a brief quiet dip within sustained input", () => {
    const gate = new BlowGate({
      threshold: 0.12,
      holdMs: 120,
      releaseMs: 80,
    });

    expect(gate.push(0.3, 70)).toBe(false);
    expect(gate.push(0.02, 20)).toBe(false);
    expect(gate.push(0.3, 50)).toBe(true);
  });

  it("resets after sustained quiet input", () => {
    const gate = new BlowGate({
      threshold: 0.12,
      holdMs: 180,
      releaseMs: 80,
    });

    expect(gate.push(0.3, 80)).toBe(false);
    expect(gate.push(0.02, 80)).toBe(false);
    expect(gate.push(0.3, 100)).toBe(false);
  });
});

describe("createBlowDetector", () => {
  it("resumes a suspended audio context before listening", async () => {
    const { resume } = installAudioMocks({ contextState: "suspended" });
    const detector = createBlowDetector(vi.fn());

    await detector.start();

    expect(resume).toHaveBeenCalled();
    detector.stop();
  });

  it("requests microphone input without speech processing", async () => {
    const { getUserMedia } = installAudioMocks();
    const detector = createBlowDetector(vi.fn());

    await detector.start();

    expect(getUserMedia).toHaveBeenCalledWith({
      audio: {
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
      },
    });
    detector.stop();
  });

  it("detects sustained low-amplitude float microphone input", async () => {
    const { analyser, runFrame } = installAudioMocks({ floatSample: 0.018 });
    const onBlow = vi.fn();
    const detector = createBlowDetector(onBlow);
    const startedAt = performance.now();

    await detector.start();
    runFrame(startedAt + 60);
    runFrame(startedAt + 120);

    expect(analyser.getFloatTimeDomainData).toHaveBeenCalled();
    expect(onBlow).toHaveBeenCalledOnce();
    detector.stop();
  });
});
