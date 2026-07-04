import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

function createDetector(overrides = {}) {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    ...overrides,
  };
}

describe("App", () => {
  it("reveals once when the candle is tapped", () => {
    const playChime = vi.fn();
    render(
      <App
        playChime={playChime}
        detectorFactory={() => createDetector()}
      />,
    );

    const candle = screen.getByRole("button", { name: "轻触熄灭蜡烛" });
    fireEvent.click(candle);
    fireEvent.click(candle);

    expect(screen.getByTestId("experience")).toHaveClass("is-revealed");
    expect(playChime).toHaveBeenCalledTimes(1);
  });

  it("shows the tap fallback when microphone access fails", async () => {
    const detector = createDetector({
      start: vi.fn().mockRejectedValue(new Error("denied")),
    });
    render(
      <App
        playChime={vi.fn()}
        detectorFactory={() => detector}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "启用麦克风吹灭蜡烛" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("无法使用麦克风，轻触蜡烛也可以"),
      ).toBeVisible();
    });
  });

  it("shows how to start the microphone and confirms when listening", async () => {
    const detector = createDetector();
    render(
      <App
        playChime={vi.fn()}
        detectorFactory={() => detector}
      />,
    );

    expect(screen.getByText("轻触开启麦克风")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "启用麦克风吹灭蜡烛" }),
    );

    await waitFor(() => {
      expect(screen.getByText("正在听，请对着手机底部吹气")).toBeVisible();
    });
  });

  it("does not play the reveal chime after sound is disabled", () => {
    const playChime = vi.fn();
    render(
      <App
        playChime={playChime}
        detectorFactory={() => createDetector()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "关闭声音" }));
    fireEvent.click(screen.getByRole("button", { name: "轻触熄灭蜡烛" }));

    expect(playChime).toHaveBeenCalledWith(false);
  });
});
