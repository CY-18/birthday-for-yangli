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

function createMusicPlayer(overrides = {}) {
  return {
    prepare: vi.fn(),
    play: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  };
}

describe("App", () => {
  it("reveals once when the candle is tapped", () => {
    const player = createMusicPlayer();
    render(
      <App
        detectorFactory={() => createDetector()}
        musicPlayerFactory={() => player}
      />,
    );

    expect(screen.getByAltText("点燃蜡烛的生日蛋糕")).toHaveAttribute(
      "src",
      "./assets/birthday-lit-no-flame.jpg",
    );
    expect(screen.getByTestId("flame-effect")).toHaveAttribute(
      "src",
      "./assets/candle-flame-small.png",
    );
    expect(screen.getByAltText("蜡烛熄灭后出现生日祝福")).toHaveAttribute(
      "src",
      "./assets/birthday-reveal-time.jpg",
    );
    const candle = screen.getByRole("button", { name: "轻触熄灭蜡烛" });
    fireEvent.click(candle);
    fireEvent.click(candle);

    expect(screen.getByTestId("experience")).toHaveClass("is-revealed");
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("shows the tap fallback when microphone access fails", async () => {
    const detector = createDetector({
      start: vi.fn().mockRejectedValue(new Error("denied")),
    });
    render(
      <App
        detectorFactory={() => detector}
        musicPlayerFactory={() => createMusicPlayer()}
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
    const player = createMusicPlayer();
    render(
      <App
        detectorFactory={() => detector}
        musicPlayerFactory={() => player}
      />,
    );

    expect(screen.getByText("轻触开启麦克风")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "启用麦克风吹灭蜡烛" }),
    );

    await waitFor(() => {
      expect(screen.getByText("对着手机底部吹气")).toBeVisible();
    });
    expect(screen.queryByText(/正在听/)).not.toBeInTheDocument();
    expect(player.prepare).toHaveBeenCalledOnce();
  });

  it("does not play music and stops active audio after sound is disabled", () => {
    const player = createMusicPlayer();
    render(
      <App
        detectorFactory={() => createDetector()}
        musicPlayerFactory={() => player}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "关闭声音" }));
    fireEvent.click(screen.getByRole("button", { name: "轻触熄灭蜡烛" }));

    expect(player.stop).toHaveBeenCalled();
    expect(player.play).toHaveBeenCalledWith(false);
  });
});
