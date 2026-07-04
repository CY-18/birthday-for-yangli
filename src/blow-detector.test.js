import { describe, expect, it } from "vitest";
import { BlowGate } from "./blow-detector";

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
