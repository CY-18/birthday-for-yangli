import { describe, expect, it } from "vitest";
import * as flamePosition from "./flame-position";

const source = {
  sourceWidth: 853,
  sourceHeight: 1844,
  rect: {
    x: 385,
    y: 445,
    width: 100,
    height: 125,
  },
};

describe("positionFlameForCover", () => {
  it("tracks the poster crop in a shorter embedded-browser viewport", () => {
    expect(flamePosition.positionFlameForCover).toBeTypeOf("function");

    const position = flamePosition.positionFlameForCover({
      ...source,
      containerWidth: 390,
      containerHeight: 786,
    });

    expect(position.left).toBeCloseTo(176.03, 1);
    expect(position.top).toBeCloseTo(174.91, 1);
    expect(position.width).toBeCloseTo(45.72, 1);
    expect(position.height).toBeCloseTo(57.15, 1);
  });

  it("tracks the poster crop in the standard 390 by 844 viewport", () => {
    expect(flamePosition.positionFlameForCover).toBeTypeOf("function");

    const position = flamePosition.positionFlameForCover({
      ...source,
      containerWidth: 390,
      containerHeight: 844,
    });

    expect(position.left).toBeCloseTo(175.99, 1);
    expect(position.top).toBeCloseTo(203.68, 1);
  });
});
