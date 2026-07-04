import { afterEach, describe, expect, it, vi } from "vitest";
import { BlowGate, createBlowDetector } from "./blow-detector";

function installAudioMocks({ contextState = "running", sample = 128 } = {}) {
  let scheduledFrame;
  const resume = vi.fn().mockResolvedValue();
  const close = vi.fn().mockResolvedValue();
  const stopTrack = vi.fn();
  const analyser = {
    fftSize: 0,
    getByteTimeDomainData: vi.fn((values) => values.fill(sample)),
  };

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
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: stopTrack }],
      }),
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

  it("resets after quiet input", () => {
    const gate = new BlowGate({ threshold: 0.12, holdMs: 180 });

    expect(gate.push(0.3, 80)).toBe(false);
    expect(gate.push(0.02, 20)).toBe(false);
    expect(gate.push(0.3, 100)).toBe(false);
  });
});

describe("createBlowDetector", () => {
  it("resumes a suspended audio context before listening", async () => {
    const { resume } = installAudioMocks({ contextState: "suspended" });
    const detector = createBlowDetector(vi.fn());

    await detector.start();

    expect(resume).toHaveBeenCalledOnce();
    detector.stop();
  });

  it("detects sustained moderate phone microphone input", async () => {
    const { runFrame } = installAudioMocks({ sample: 134 });
    const onBlow = vi.fn();
    const detector = createBlowDetector(onBlow);
    const startedAt = performance.now();

    await detector.start();
    runFrame(startedAt + 70);
    runFrame(startedAt + 140);
    runFrame(startedAt + 210);

    expect(onBlow).toHaveBeenCalledOnce();
    detector.stop();
  });
});
