# Design QA

## Evidence

- Lit-state source truth: `/Users/YangMac/.codex/generated_images/019f2e9d-bf66-7443-b2ba-9235ab4ea638/call_o8anFJ2IHw416LvK3IOfTijO.png`
- No-flame lit base: `public/assets/birthday-lit-no-flame.jpg`
- Reveal-state source truth: `public/assets/birthday-reveal-time.jpg`
- Lit implementation screenshots: `qa/flame-clean-390x786-a.png`, `qa/flame-clean-390x786-b.png`, `qa/flame-clean-390x844.png`
- Reveal implementation screenshot: `qa/reveal-time-copy-390.png`
- Revised microphone prompt screenshot: `qa/mic-prompt-390.png`
- Focused microphone state screenshot: `qa/mic-focus-390.png`
- Reveal text comparison: `qa/compare-reveal-time-copy.png`
- Flame motion screenshots: `qa/flame-motion-a-390.png`, `qa/flame-motion-b-390.png`
- Flame extinguish screenshots: `qa/flame-extinguish-390.png`, `qa/flame-reveal-390.png`
- User-reported alignment evidence: `/Users/YangMac/Downloads/微信图片_20260705103340_38_2.jpg`
- Embedded-browser alignment screenshots: `qa/flame-misaligned-390x786.png`, `qa/flame-aligned-390x786-a.png`, `qa/flame-aligned-390x786-b.png`
- Alignment comparisons: `qa/compare-flame-alignment-390x786.png`, `qa/compare-flame-alignment-crop.png`
- Clean flame comparisons: `qa/compare-flame-clean-motion.png`, `qa/compare-flame-clean-crop.png`
- Clean extinguish screenshots: `qa/flame-clean-extinguish-390.png`, `qa/flame-clean-reveal-390.png`
- Full-view comparisons: `qa/compare-lit.png`, `qa/compare-reveal-time-copy.png`, `qa/compare-mic-prompt.png`, `qa/compare-flame-motion.png`
- Focused comparison: `qa/compare-mic-prompt-crop.png`
- Viewports checked: 390×786, 390×844, 393×852, 430×932
- States checked: lit, microphone activation, microphone focus, reveal with music scheduling, microphone-unavailable fallback, sound toggle

## Required Fidelity Surfaces

- Fonts and typography: All poster typography remains inside the approved scene assets, so font family, weight, wrapping and antialiasing match the source exactly. The added 13px microphone status is readable but visually subordinate.
- Spacing and layout rhythm: At 390×844, the revised microphone status sits between the decorative handwriting and the original blow instruction without covering either. The 393×852 and 430×932 captures retain the complete cake, recipient name, instruction and reveal copy.
- Colors and visual tokens: The blush background, hot-pink display type, dark-plum handwriting and yellow accents match the source assets. The microphone status uses a 48%-opaque blush-white surface with no border; the sound control remains subordinate.
- Image quality and asset fidelity: Source PNGs were converted to 88-quality JPEGs, reducing the two-image payload from about 3.1MB to about 599KB. Visual inspection at 390×844 shows no readable-text loss, haloing or material degradation.
- Copy and content: Lit state contains `To 杨丽`, `轻触开启麦克风` and `吹灭蜡烛，许个愿吧`. Listening copy is exactly `对着手机底部吹气`. Reveal state contains no recipient line and shows `又长大一岁，但你仍然是时间流逝中的例外。` with the approved English supporting line.
- Icons and controls: The sound icon comes from Phosphor Icons. The microphone and waveform remain part of the approved image. Transparent semantic buttons make the visible microphone and candle areas functional.
- Accessibility: All controls have Chinese accessible names, tap targets exceed 44px, reduced motion is supported, and the microphone-denied path provides a visible fallback message. The microphone focus indicator is now confined to its visible status pill instead of outlining the full invisible hit area.

## Findings

- [Resolved P2] Candle focus outline remained visible after reveal.
  - Evidence: The initial 390×844 reveal capture showed a large yellow outline around the invisible candle hit area.
  - Impact: It obscured the blessing and broke the poster illusion.
  - Fix: Hide microphone and candle hit areas after the reveal transition while retaining their lit-state keyboard focus indicators.

- [Resolved P2] Microphone prompt obscured the visual and moved too low in the first revision.
  - Evidence: The initial revision placed the status close to the baked-in blow instruction; the final comparison shows it centered in the available gap.
  - Impact: Incorrect placement competed with either the cake artwork or the primary interaction copy.
  - Fix: Set the status position to 18% within the microphone hit area, approximately 20px below its original position.

- [Resolved P2] Large yellow microphone focus border.
  - Evidence: The first focused capture outlined the full bottom hit area in yellow; `qa/mic-focus-390.png` shows only a subtle status-pill focus treatment.
  - Impact: The large rectangle broke the poster composition.
  - Fix: Remove the large microphone outline and retain a low-contrast focus ring on the visible pill.

- [Resolved P2] Candle flame lacked visible motion.
  - Evidence: `qa/flame-clean-390x786-a.png` and `qa/flame-clean-390x786-b.png` show distinct flame width, tilt and brightness states while all surrounding artwork remains static.
  - Impact: The original raster flame read as static, weakening the invitation to blow.
  - Fix: Remove the baked-in flame from the poster, then animate only a tightly cropped flame asset at full opacity. On reveal, shrink and fade that small asset before the scene transition completes.

- [Resolved P1] Animated flame shifted below the source flame in an embedded mobile browser.
  - Evidence: The user screenshot and `qa/flame-misaligned-390x786.png` show a second bright flame patch below the raster flame. The focused before/after comparison in `qa/compare-flame-alignment-crop.png` shows the corrected overlap.
  - Impact: The duplicated flame broke the candle illusion on the actual delivery surface.
  - Fix: Compute the small flame's pixel rectangle from the same `object-fit: cover` scale and crop offsets used by the poster at every container size.

- [Resolved P1] Full-page animated layer produced an outer ghost frame.
  - Evidence: The full-poster transparent-layer attempt moved a faint rectangular boundary with the flame. `qa/compare-flame-clean-motion.png` shows the final two animation states with identical page edges, cake and typography.
  - Impact: The animated frame made the entire poster appear doubled instead of isolating the candlelight.
  - Fix: Remove the full-poster animated layer entirely. Use `birthday-lit-no-flame.jpg` as the static base and animate only `candle-flame-small.png`.

- [Accepted P3] Sound control is not present in the source visual.
  - Evidence: The implementation adds one 38px translucent control at the top-right.
  - Rationale: The user approved a sound toggle; its treatment follows the source palette and does not alter the main hierarchy.

## Focused Region Comparison

`qa/compare-mic-prompt-crop.png` compares the source and implementation bottom 220px at the same 390px width. `qa/compare-flame-clean-crop.png` isolates the candle region across two animation frames and confirms that only the flame changes.

## Patches Since First QA Pass

- Hidden candle and microphone hit areas after reveal to remove persistent focus chrome.
- Replaced 1.5–1.6MB PNG assets with visually equivalent 293–306KB JPEG assets.
- Verified microphone-unavailable fallback in the in-app browser.
- Moved the microphone status to the user-approved middle position and increased its transparency.
- Replaced the large yellow microphone outline with a subtle status-pill focus treatment.
- Replaced the three-tone chime with a 13.75-second slow jazz birthday arrangement and verified scheduling through automated tests.
- Increased phone blow sensitivity with unprocessed microphone constraints, float waveform sampling, a 0.01 threshold and 80ms dropout tolerance.
- Added a source-derived animated flame and verified both lit keyframes and the extinguish transition at 390×844.
- Replaced the reveal headline with the approved time-themed sentence and verified the three-line layout against the new source image at 390×844.
- Removed the superseded full-poster transparent layer after it produced an outer ghost frame.
- Created a no-flame base poster and positioned a small full-opacity flame with tested cover-crop coordinates at 390×786 and 390×844.

## Remaining Test Gap

- The in-app browser does not expose real acoustic input, so phone hardware remains the final check. Automated tests now cover low-amplitude float input, raw microphone constraints and short signal dropouts; permission failure and candle-tap fallback paths are also verified.

final result: passed
