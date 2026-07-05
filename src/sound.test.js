import { describe, expect, it, vi } from "vitest";
import * as sound from "./sound";

describe("birthday music player", () => {
  it("prepares audio and schedules a full birthday arrangement", () => {
    const oscillators = [];
    const resume = vi.fn();

    class FakeAudioContext {
      currentTime = 5;
      destination = {};
      state = "suspended";

      resume() {
        this.state = "running";
        resume();
        return Promise.resolve();
      }

      createGain() {
        return {
          connect: vi.fn(),
          gain: {
            cancelScheduledValues: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            setTargetAtTime: vi.fn(),
            setValueAtTime: vi.fn(),
          },
        };
      }

      createOscillator() {
        const oscillator = {
          connect: vi.fn(),
          frequency: { setValueAtTime: vi.fn() },
          start: vi.fn(),
          stop: vi.fn(),
          type: "sine",
        };
        oscillators.push(oscillator);
        return oscillator;
      }

      close() {
        return Promise.resolve();
      }
    }

    expect(sound.createBirthdayMusicPlayer).toBeTypeOf("function");

    const player = sound.createBirthdayMusicPlayer({
      AudioContextClass: FakeAudioContext,
    });
    player.prepare();
    player.play(true);

    const startTimes = oscillators.flatMap((node) =>
      node.start.mock.calls.map(([time]) => time),
    );
    const stopTimes = oscillators.flatMap((node) =>
      node.stop.mock.calls.map(([time]) => time),
    );

    expect(resume).toHaveBeenCalledOnce();
    expect(oscillators.length).toBeGreaterThan(20);
    expect(Math.max(...stopTimes) - Math.min(...startTimes)).toBeGreaterThan(10);

    player.stop();
    player.destroy();
  });
});
