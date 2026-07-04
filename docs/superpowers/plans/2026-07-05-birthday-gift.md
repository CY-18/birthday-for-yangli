# 杨丽生日互动网页 Implementation Plan

> Superseded by `2026-07-05-birthday-gift-react.md` after the required Product Design bootstrap was inspected and found to provide a React/Vite starter.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建并发布一个可在手机浏览器中通过吹气或点击蜡烛触发祝福揭晓的生日网页。

**Architecture:** 使用 Vite + TypeScript 构建单页静态站点。两张已确认的 390×844 场景图作为视觉状态层，原生 Web Audio API 负责麦克风吹气检测与短提示音，CSS 负责响应式铺满、安全区和交叉淡入淡出。

**Tech Stack:** Vite 7、TypeScript 5、Vitest、jsdom、Phosphor Icons、GitHub Pages Actions

---

### Task 1: 初始化独立项目与视觉资源

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `public/assets/birthday-lit.png`
- Create: `public/assets/birthday-reveal.png`

- [ ] **Step 1: 初始化独立 Git 仓库**

Run:

```bash
cd /Users/YangMac/Desktop/CodeX/birthday-for-yangli
git init -b main
```

Expected: 输出 `Initialized empty Git repository`。

- [ ] **Step 2: 写入最小依赖清单**

```json
{
  "name": "birthday-for-yangli",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@phosphor-icons/web": "^2.1.1"
  },
  "devDependencies": {
    "jsdom": "^26.1.0",
    "typescript": "^5.8.3",
    "vite": "^7.0.0",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 3: 写入 TypeScript 与 Vite 配置**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

```ts
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  test: {
    environment: "jsdom",
  },
});
```

- [ ] **Step 4: 写入页面入口**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#f5dcdc" />
    <meta name="description" content="To 杨丽，一份生日惊喜。" />
    <title>To 杨丽</title>
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: 复制确认后的视觉资源**

Run:

```bash
mkdir -p public/assets
cp /Users/YangMac/.codex/generated_images/019f2e9d-bf66-7443-b2ba-9235ab4ea638/call_o8anFJ2IHw416LvK3IOfTijO.png public/assets/birthday-lit.png
cp /Users/YangMac/.codex/generated_images/019f2e9d-bf66-7443-b2ba-9235ab4ea638/call_ZbcidV2byDsMJe4F3hzM92cz.png public/assets/birthday-reveal.png
```

Expected: 两张图片均为手机长屏比例且文件非空。

- [ ] **Step 6: 安装依赖并提交**

Run:

```bash
npm install
git add package.json package-lock.json tsconfig.json vite.config.ts index.html public/assets docs
git commit -m "chore: initialize birthday experience"
```

Expected: 安装成功，生成首个提交。

### Task 2: 以测试驱动实现吹气判定

**Files:**
- Create: `src/blow-detector.ts`
- Create: `tests/blow-detector.test.ts`

- [ ] **Step 1: 写入失败测试**

```ts
import { describe, expect, it } from "vitest";
import { BlowGate } from "../src/blow-detector";

describe("BlowGate", () => {
  it("只在音量持续超过阈值后触发一次", () => {
    const gate = new BlowGate({ threshold: 0.12, holdMs: 180 });

    expect(gate.push(0.2, 80)).toBe(false);
    expect(gate.push(0.2, 100)).toBe(true);
    expect(gate.push(0.3, 200)).toBe(false);
  });

  it("短促噪声不会触发", () => {
    const gate = new BlowGate({ threshold: 0.12, holdMs: 180 });

    expect(gate.push(0.3, 70)).toBe(false);
    expect(gate.push(0.02, 30)).toBe(false);
    expect(gate.push(0.3, 70)).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/blow-detector.test.ts`

Expected: FAIL，提示无法导入 `BlowGate`。

- [ ] **Step 3: 实现最小判定与麦克风检测**

```ts
export interface BlowGateOptions {
  threshold: number;
  holdMs: number;
}

export class BlowGate {
  private aboveMs = 0;
  private triggered = false;

  constructor(private readonly options: BlowGateOptions) {}

  push(level: number, deltaMs: number): boolean {
    if (this.triggered) return false;

    if (level >= this.options.threshold) {
      this.aboveMs += deltaMs;
    } else {
      this.aboveMs = 0;
    }

    if (this.aboveMs < this.options.holdMs) return false;
    this.triggered = true;
    return true;
  }
}

export class BlowDetector {
  private stream?: MediaStream;
  private context?: AudioContext;
  private frame?: number;

  constructor(private readonly onBlow: () => void) {}

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: false,
        echoCancellation: true,
        noiseSuppression: false,
      },
    });
    this.context = new AudioContext();
    const source = this.context.createMediaStreamSource(this.stream);
    const analyser = this.context.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);

    const samples = new Uint8Array(analyser.fftSize);
    const gate = new BlowGate({ threshold: 0.12, holdMs: 180 });
    let previous = performance.now();

    const tick = (now: number) => {
      analyser.getByteTimeDomainData(samples);
      const rms = Math.sqrt(
        samples.reduce((sum, value) => {
          const normalized = (value - 128) / 128;
          return sum + normalized * normalized;
        }, 0) / samples.length,
      );
      if (gate.push(rms, now - previous)) this.onBlow();
      previous = now;
      this.frame = requestAnimationFrame(tick);
    };

    this.frame = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.context?.close();
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/blow-detector.test.ts`

Expected: 2 tests PASS。

- [ ] **Step 5: 提交**

```bash
git add src/blow-detector.ts tests/blow-detector.test.ts
git commit -m "feat: detect sustained blowing"
```

### Task 3: 实现视觉状态、备用操作与短提示音

**Files:**
- Create: `src/app.ts`
- Create: `src/sound.ts`
- Create: `src/main.ts`
- Create: `src/styles.css`
- Create: `tests/app.test.ts`

- [ ] **Step 1: 写入失败的交互测试**

```ts
import { describe, expect, it, vi } from "vitest";
import { mountBirthdayExperience } from "../src/app";

describe("birthday experience", () => {
  it("点击蜡烛后只揭晓一次", () => {
    document.body.innerHTML = '<main id="app"></main>';
    const playChime = vi.fn();
    const app = mountBirthdayExperience(document.querySelector("#app")!, {
      playChime,
      detectorFactory: () => ({ start: vi.fn(), stop: vi.fn() }),
    });

    app.candle.click();
    app.candle.click();

    expect(app.root.classList.contains("is-revealed")).toBe(true);
    expect(playChime).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/app.test.ts`

Expected: FAIL，提示无法导入 `mountBirthdayExperience`。

- [ ] **Step 3: 实现提示音**

```ts
export function playRevealChime(enabled: boolean): void {
  if (!enabled) return;
  const context = new AudioContext();
  const gain = context.createGain();
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.2);

  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(context.currentTime + index * 0.08);
    oscillator.stop(context.currentTime + 1.2);
  });
}
```

- [ ] **Step 4: 实现页面状态与控件**

```ts
import { BlowDetector } from "./blow-detector";

interface DetectorLike {
  start(): Promise<void> | void;
  stop(): void;
}

interface AppDependencies {
  playChime: (enabled: boolean) => void;
  detectorFactory: (onBlow: () => void) => DetectorLike;
}

export function mountBirthdayExperience(
  container: Element,
  dependencies: AppDependencies,
) {
  container.innerHTML = `
    <section class="experience" aria-live="polite">
      <img class="scene scene--lit" src="./assets/birthday-lit.png" alt="点燃蜡烛的生日蛋糕" />
      <img class="scene scene--reveal" src="./assets/birthday-reveal.png" alt="蜡烛熄灭后出现生日祝福" />
      <button class="sound-toggle" type="button" aria-label="关闭声音">
        <i class="ph ph-speaker-high" aria-hidden="true"></i>
      </button>
      <button class="mic-control" type="button" aria-label="启用麦克风吹灭蜡烛"></button>
      <button class="candle-control" type="button" aria-label="轻触熄灭蜡烛"></button>
      <p class="toast" role="status" hidden>无法使用麦克风，轻触蜡烛也可以</p>
    </section>
  `;

  const root = container.querySelector<HTMLElement>(".experience")!;
  const candle = container.querySelector<HTMLButtonElement>(".candle-control")!;
  const mic = container.querySelector<HTMLButtonElement>(".mic-control")!;
  const sound = container.querySelector<HTMLButtonElement>(".sound-toggle")!;
  const toast = container.querySelector<HTMLElement>(".toast")!;
  let soundEnabled = true;
  let revealed = false;
  let detector: DetectorLike | undefined;

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    detector?.stop();
    root.classList.add("is-revealed");
    dependencies.playChime(soundEnabled);
  };

  candle.addEventListener("click", reveal);
  mic.addEventListener("click", async () => {
    detector ??= dependencies.detectorFactory(reveal);
    try {
      await detector.start();
      root.classList.add("is-listening");
    } catch {
      toast.hidden = false;
    }
  });
  sound.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    sound.setAttribute("aria-label", soundEnabled ? "关闭声音" : "开启声音");
    sound.innerHTML = `<i class="ph ${soundEnabled ? "ph-speaker-high" : "ph-speaker-slash"}" aria-hidden="true"></i>`;
  });

  return { root, candle };
}

export function createDefaultExperience(container: Element) {
  return mountBirthdayExperience(container, {
    playChime: (enabled) => import("./sound").then(({ playRevealChime }) => playRevealChime(enabled)),
    detectorFactory: (onBlow) => new BlowDetector(onBlow),
  });
}
```

- [ ] **Step 5: 写入入口和响应式样式**

```ts
import "@phosphor-icons/web/regular/style.css";
import "./styles.css";
import { createDefaultExperience } from "./app";

createDefaultExperience(document.querySelector("#app")!);
```

CSS 必须实现：

```css
* { box-sizing: border-box; }
html, body, #app { width: 100%; min-height: 100%; margin: 0; }
body { overflow: hidden; background: #f5dcdc; }
.experience {
  position: relative;
  width: min(100vw, 430px);
  height: 100dvh;
  min-height: 620px;
  margin: 0 auto;
  overflow: hidden;
  background: #f5dcdc;
}
.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 1.1s ease, transform 1.1s ease;
}
.scene--reveal { opacity: 0; transform: scale(1.015); }
.is-revealed .scene--lit { opacity: 0; transform: scale(0.99); }
.is-revealed .scene--reveal { opacity: 1; transform: scale(1); }
.sound-toggle {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 12px);
  right: 14px;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  color: #5a0b31;
  background: rgb(255 244 246 / 72%);
}
.mic-control {
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: calc(env(safe-area-inset-bottom) + 4%);
  height: 13%;
  border: 0;
  background: transparent;
}
.candle-control {
  position: absolute;
  left: 41%;
  top: 24%;
  width: 18%;
  height: 28%;
  border: 0;
  background: transparent;
}
.is-revealed .mic-control,
.is-revealed .candle-control { pointer-events: none; }
.toast {
  position: absolute;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 18px);
  transform: translateX(-50%);
  margin: 0;
  padding: 9px 14px;
  border-radius: 999px;
  color: #fff;
  background: rgb(74 10 40 / 88%);
  font: 14px/1.3 system-ui, sans-serif;
  white-space: nowrap;
}
@media (min-width: 431px) {
  body { display: grid; place-items: center; background: #ead0d3; }
  .experience { box-shadow: 0 24px 80px rgb(77 24 45 / 20%); }
}
@media (prefers-reduced-motion: reduce) {
  .scene { transition-duration: 0.01ms; }
}
```

- [ ] **Step 6: 运行全部测试与构建**

Run:

```bash
npm test
npm run build
```

Expected: 全部测试 PASS，Vite 构建成功。

- [ ] **Step 7: 提交**

```bash
git add src tests
git commit -m "feat: add interactive birthday reveal"
```

### Task 4: 手机视觉 QA 与兼容性修正

**Files:**
- Create: `design-qa.md`
- Modify: `src/styles.css`
- Modify: `src/app.ts`

- [ ] **Step 1: 启动本地站点**

Run: `npm run dev -- --host 127.0.0.1`

Expected: 输出本地 HTTP 地址。

- [ ] **Step 2: 在 390×844 捕获点燃状态**

使用浏览器工具打开本地地址，设置 390×844 视口，确认图片完整铺满、顶部姓名和底部提示位于安全区内。

- [ ] **Step 3: 捕获揭晓状态**

点击蜡烛，确认只切换一次、提示音只调用一次、揭晓图无 `To 杨丽`。

- [ ] **Step 4: 检查 393×852 与 430×932**

确认 `object-fit: cover` 不裁切姓名、祝福、蛋糕或交互提示；如有裁切，仅调整 `.scene` 的 `object-position` 和控制热区。

- [ ] **Step 5: 写入并通过视觉 QA**

`design-qa.md` 必须记录参考图、实拍视口、发现的问题及修复结果，并以：

```text
final result: passed
```

结束。

- [ ] **Step 6: 再次验证**

Run:

```bash
npm test
npm run build
```

Expected: 测试与构建均成功。

- [ ] **Step 7: 提交**

```bash
git add src design-qa.md
git commit -m "fix: polish mobile birthday layout"
```

### Task 5: GitHub Pages 发布

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

- [ ] **Step 1: 写入 Pages 工作流**

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 写入 README**

README 说明用途、本地运行命令、麦克风权限只在本地处理、GitHub Pages 部署方式。

- [ ] **Step 3: 创建公开仓库并推送**

Run:

```bash
gh repo create CY-18/birthday-for-yangli --public --source=. --remote=origin
git add .github README.md
git commit -m "ci: deploy birthday site to pages"
git push -u origin main
```

Expected: 远程仓库创建成功并推送 `main`。

- [ ] **Step 4: 启用并验证 Pages**

Run:

```bash
gh api -X POST repos/CY-18/birthday-for-yangli/pages -f build_type=workflow
gh run watch --exit-status
```

Expected: Pages workflow 成功。

- [ ] **Step 5: 验证公开链接**

打开 `https://cy-18.github.io/birthday-for-yangli/`，在手机视口完成麦克风与点击备用路径测试。

## Self-Review

- 规格中的点燃状态、揭晓状态、麦克风吹气、点击备用、短提示音、声音开关、三种手机视口与 GitHub Pages 均有对应任务。
- 无 `TBD`、`TODO` 或未定义接口。
- `BlowGate`、`BlowDetector`、`mountBirthdayExperience` 与测试中的名称保持一致。
