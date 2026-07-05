# Birthday Music And Microphone Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 下移并弱化麦克风提示，在蜡烛熄灭后播放一次慢拍爵士钢琴生日旋律。

**Architecture:** React 继续管理监听、揭晓和静音状态。`sound.js` 提供一个拥有 `prepare`、`play`、`stop`、`destroy` 方法的 Web Audio 播放器，页面在用户点击麦克风时预激活，在揭晓时播放。

**Tech Stack:** React 19、Vite 6、Web Audio API、Vitest、Testing Library

---

### Task 1: 调整麦克风提示

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Test: `src/App.test.jsx`

- [ ] **Step 1: 写失败测试**

在 `src/App.test.jsx` 中断言监听后出现精确文案：

```jsx
expect(screen.getByText("对着手机底部吹气")).toBeVisible();
expect(screen.queryByText(/正在听/)).not.toBeInTheDocument();
```

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- src/App.test.jsx`

Expected: FAIL，因为当前页面仍显示 `正在听，请对着手机底部吹气`。

- [ ] **Step 3: 最小实现**

把监听文案改为 `对着手机底部吹气`。将 `.mic-status` 下移、背景透明度降低并删除边框；删除 `.is-listening .mic-control` 的黄色内边框。

- [ ] **Step 4: 运行并确认通过**

Run: `npm test -- src/App.test.jsx`

Expected: PASS。

### Task 2: 实现生日音乐播放器

**Files:**
- Modify: `src/sound.js`
- Create: `src/sound.test.js`

- [ ] **Step 1: 写失败测试**

测试期望 `createBirthdayMusicPlayer` 返回可预激活和播放的播放器，并且安排超过 20 个音符、总时长超过 10 秒：

```js
const player = sound.createBirthdayMusicPlayer({ AudioContextClass });
player.prepare();
player.play(true);

expect(resume).toHaveBeenCalled();
expect(oscillators.length).toBeGreaterThan(20);
expect(Math.max(...stopTimes) - Math.min(...startTimes)).toBeGreaterThan(10);
```

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- src/sound.test.js`

Expected: FAIL，因为当前只有 1.2 秒三声音效，没有播放器接口。

- [ ] **Step 3: 最小实现**

在 `src/sound.js` 中定义《Happy Birthday》旋律音符和 0.55 秒拍长。`prepare()` 创建并恢复音频上下文；`play(true)` 使用三角波与正弦波包络安排旋律、低音和七和弦；`stop()` 停止当前节点；`destroy()` 关闭上下文。

- [ ] **Step 4: 运行并确认通过**

Run: `npm test -- src/sound.test.js`

Expected: PASS。

### Task 3: 接入交互并验证

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`
- Modify: `design-qa.md`

- [ ] **Step 1: 写失败测试**

断言点击麦克风会调用 `prepare()`，揭晓会调用 `play(true)`，静音会调用 `stop()`：

```jsx
expect(player.prepare).toHaveBeenCalledOnce();
expect(player.play).toHaveBeenCalledWith(true);
expect(player.stop).toHaveBeenCalled();
```

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- src/App.test.jsx`

Expected: FAIL，因为页面尚未使用新的音乐播放器。

- [ ] **Step 3: 最小实现**

通过 `musicPlayerFactory` 创建一次播放器。启动麦克风前调用 `prepare()`；揭晓时调用 `play(soundEnabled)`；关闭声音时调用 `stop()`；卸载时调用 `destroy()`。

- [ ] **Step 4: 完整验证**

Run:

```bash
npm test
npm run build
```

Expected: 全部测试通过且构建成功。随后在 390×844 下检查点燃、监听和揭晓状态，并更新 `design-qa.md`。

- [ ] **Step 5: 提交与发布**

```bash
git add src docs design-qa.md
git commit -m "feat: play birthday music on reveal"
git push origin main
```

