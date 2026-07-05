import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createBlowDetector } from "./blow-detector";
import { createBirthdayMusicPlayer } from "./sound";

export function App({
  detectorFactory = createBlowDetector,
  musicPlayerFactory = createBirthdayMusicPlayer,
}) {
  const [revealed, setRevealed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(false);
  const detectorRef = useRef();
  const musicPlayerRef = useRef();
  const revealedRef = useRef(false);
  const soundEnabledRef = useRef(true);
  musicPlayerRef.current ??= musicPlayerFactory();

  const reveal = useCallback(() => {
    if (revealedRef.current) return;

    revealedRef.current = true;
    detectorRef.current?.stop();
    setRevealed(true);
    musicPlayerRef.current.play(soundEnabledRef.current);
  }, []);

  useEffect(() => {
    return () => {
      detectorRef.current?.stop();
      musicPlayerRef.current.destroy();
    };
  }, []);

  const startListening = async () => {
    if (listening || revealed) return;

    detectorRef.current ??= detectorFactory(reveal);
    setError(false);
    musicPlayerRef.current.prepare();

    try {
      await detectorRef.current.start();
      setListening(true);
    } catch {
      setError(true);
    }
  };

  const toggleSound = () => {
    soundEnabledRef.current = !soundEnabledRef.current;
    setSoundEnabled(soundEnabledRef.current);
    if (!soundEnabledRef.current) {
      musicPlayerRef.current.stop();
    }
  };

  return (
    <main
      className={`experience${revealed ? " is-revealed" : ""}${listening ? " is-listening" : ""}`}
      data-testid="experience"
    >
      <img
        className="scene scene--lit"
        src="./assets/birthday-lit.jpg"
        alt="点燃蜡烛的生日蛋糕"
        aria-hidden={revealed}
      />
      <img
        className="scene scene--reveal"
        src="./assets/birthday-reveal-time.jpg"
        alt="蜡烛熄灭后出现生日祝福"
        aria-hidden={!revealed}
      />
      <img
        className="flame-effect"
        src="./assets/candle-flame-layer.png"
        alt=""
        aria-hidden="true"
        data-testid="flame-effect"
      />

      <button
        className="sound-toggle"
        type="button"
        aria-label={soundEnabled ? "关闭声音" : "开启声音"}
        onClick={toggleSound}
      >
        {soundEnabled ? (
          <SpeakerHigh aria-hidden="true" weight="regular" />
        ) : (
          <SpeakerSlash aria-hidden="true" weight="regular" />
        )}
      </button>

      <button
        className="mic-control"
        type="button"
        aria-label={listening ? "正在聆听，请吹向蜡烛" : "启用麦克风吹灭蜡烛"}
        onClick={startListening}
      >
        {!error && (
          <span className="mic-status" aria-hidden="true">
            {listening ? "对着手机底部吹气" : "轻触开启麦克风"}
          </span>
        )}
      </button>
      <button
        className="candle-control"
        type="button"
        aria-label="轻触熄灭蜡烛"
        onClick={reveal}
      />

      {error && (
        <p className="toast" role="status">
          无法使用麦克风，轻触蜡烛也可以
        </p>
      )}
    </main>
  );
}
