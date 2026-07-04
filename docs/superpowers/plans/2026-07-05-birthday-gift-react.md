# 杨丽生日互动网页 React Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建并发布一个可在手机浏览器中通过吹气或点击蜡烛触发祝福揭晓的生日网页。

**Architecture:** 使用 Product Design 提供的 React 19 + Vite 6 原型启动器。两张确认后的 390×844 场景图作为前后视觉状态，Web Audio API 负责吹气检测与短提示音，React 管理权限、声音和揭晓状态，CSS 负责安全区及交叉淡入淡出。

**Tech Stack:** React 19、Vite 6、Vitest、Testing Library、jsdom、Phosphor Icons、GitHub Pages Actions

---

### Task 1: 初始化独立项目并导入视觉资源

**Files:**
- Create: `.git/`
- Create: `package.json`
- Create: `public/assets/birthday-lit.png`
- Create: `public/assets/birthday-reveal.png`

- [ ] 使用 Product Design 启动器创建临时项目，将启动器内容复制到 `/Users/YangMac/Desktop/CodeX/birthday-for-yangli`，保留现有 `docs/`。
- [ ] 在项目目录运行 `git init -b main`，确认这是独立仓库。
- [ ] 将依赖补充为：

```json
{
  "dependencies": {
    "@phosphor-icons/react": "^2.1.10",
    "@vitejs/plugin-react": "5.0.4",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "vite": "6.4.2"
  },
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "jsdom": "^26.1.0",
    "vitest": "^3.2.4"
  }
}
```

- [ ] 添加 `"test": "vitest run"` 和 `"test:watch": "vitest"` scripts，并在 `vite.config.mjs` 中使用 `vitest/config` 的 `defineConfig` 配置 `environment: "jsdom"`。
- [ ] 复制视觉资源：

```bash
mkdir -p public/assets
cp /Users/YangMac/.codex/generated_images/019f2e9d-bf66-7443-b2ba-9235ab4ea638/call_o8anFJ2IHw416LvK3IOfTijO.png public/assets/birthday-lit.png
cp /Users/YangMac/.codex/generated_images/019f2e9d-bf66-7443-b2ba-9235ab4ea638/call_ZbcidV2byDsMJe4F3hzM92cz.png public/assets/birthday-reveal.png
```

- [ ] 运行 `npm install` 和 `npm run build`，确认启动器基线构建成功。
- [ ] 提交：`git commit -m "chore: initialize birthday experience"`。

### Task 2: 测试先行实现吹气判定

**Files:**
- Create: `src/blow-detector.js`
- Create: `src/blow-detector.test.js`

- [ ] 先写测试并运行，确认因为模块缺失而失败：

```js
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
```

- [ ] 实现纯判定器与浏览器麦克风适配器：

```js
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
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: true,
          noiseSuppression: false
        }
      });
      context = new AudioContext();
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
        if (gate.push(Math.sqrt(energy / values.length), now - previous)) onBlow();
        previous = now;
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    },
    stop() {
      if (frame) cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      context?.close();
    }
  };
}
```

- [ ] 运行 `npm test -- src/blow-detector.test.js`，确认 2 项通过。
- [ ] 提交：`git commit -m "feat: detect sustained blowing"`。

### Task 3: 测试先行实现双状态页面

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Create: `src/sound.js`
- Create: `src/App.test.jsx`

- [ ] 先写测试，确认点击蜡烛只揭晓一次、麦克风失败出现提示、声音按钮可切换：

```jsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  it("reveals once when the candle is tapped", () => {
    const playChime = vi.fn();
    render(<App playChime={playChime} detectorFactory={() => ({ start: vi.fn(), stop: vi.fn() })} />);
    const candle = screen.getByRole("button", { name: "轻触熄灭蜡烛" });
    fireEvent.click(candle);
    fireEvent.click(candle);
    expect(screen.getByTestId("experience")).toHaveClass("is-revealed");
    expect(playChime).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] 实现 `playRevealChime(enabled)`：用三个正弦振荡器播放 523.25Hz、659.25Hz、783.99Hz，增益在 1.2 秒内淡出；关闭声音时立即返回。
- [ ] 实现 `App`：
  - 使用 `revealed`、`soundEnabled`、`listening`、`error` 四个状态。
  - 叠放 `./assets/birthday-lit.png` 与 `./assets/birthday-reveal.png`。
  - 底部透明热区请求麦克风，蜡烛透明热区直接揭晓。
  - 右上角使用 `@phosphor-icons/react` 的 `SpeakerHigh` / `SpeakerSlash`。
  - 揭晓函数必须幂等，并停止麦克风流。
  - 权限失败显示 `无法使用麦克风，轻触蜡烛也可以`。
- [ ] CSS 使用 `width: min(100vw, 430px)`、`height: 100dvh`、`env(safe-area-inset-*)`、两张图片 `object-fit: cover` 及 1.1 秒透明度过渡。
- [ ] 运行 `npm test` 和 `npm run build`，确认测试及构建通过。
- [ ] 提交：`git commit -m "feat: add interactive birthday reveal"`。

### Task 4: 视觉 QA、发布与线上验证

**Files:**
- Create: `design-qa.md`
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

- [ ] 启动本地站点，通过 Browser skill 在 390×844 捕获点燃与揭晓状态。
- [ ] 将参考图与实现截图合并为同一张对照图，检查字体、空间节奏、色彩、图片锐度和文字内容。
- [ ] 检查 393×852 与 430×932；修复所有 P0/P1/P2，直到 `design-qa.md` 以 `final result: passed` 结束。
- [ ] 运行最终 `npm test` 和 `npm run build`。
- [ ] 添加 GitHub Pages Actions：Node 22、`npm ci`、测试、构建、上传 `dist`、`actions/deploy-pages@v4`。
- [ ] 创建公开仓库并推送：

```bash
gh repo create CY-18/birthday-for-yangli --public --source=. --remote=origin
git add .
git commit -m "ci: deploy birthday site to pages"
git push -u origin main
gh api -X POST repos/CY-18/birthday-for-yangli/pages -f build_type=workflow
gh run watch --exit-status
```

- [ ] 在线打开 `https://cy-18.github.io/birthday-for-yangli/`，验证页面加载、点击备用路径和 Pages HTTPS。

## Self-Review

- 规格中的两种视觉状态、麦克风吹气、点击备用、短提示音、声音开关、手机安全区、三种手机视口与 GitHub Pages 均有明确任务。
- 实现文件与测试文件名称一致。
- 没有未决产品决策或占位内容。
