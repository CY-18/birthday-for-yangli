# Design QA

## Evidence

- Lit-state source truth: `/Users/YangMac/.codex/generated_images/019f2e9d-bf66-7443-b2ba-9235ab4ea638/call_o8anFJ2IHw416LvK3IOfTijO.png`
- Reveal-state source truth: `/Users/YangMac/.codex/generated_images/019f2e9d-bf66-7443-b2ba-9235ab4ea638/call_ZbcidV2byDsMJe4F3hzM92cz.png`
- Lit implementation screenshot: `qa/lit-390.png`
- Reveal implementation screenshot: `qa/reveal-390.png`
- Full-view comparisons: `qa/compare-lit.png`, `qa/compare-reveal.png`
- Viewports checked: 390×844, 393×852, 430×932
- States checked: lit, reveal, microphone-unavailable fallback, sound toggle

## Required Fidelity Surfaces

- Fonts and typography: All poster typography remains inside the approved scene assets, so font family, weight, wrapping and antialiasing match the source exactly. The only added UI type is the temporary microphone fallback toast, which uses a readable 14px system sans-serif.
- Spacing and layout rhythm: At 390×844, source and implementation align without crop drift. The 393×852 and 430×932 captures retain the complete cake, recipient name, instruction and reveal copy. Safe-area offsets protect the sound control and bottom interaction.
- Colors and visual tokens: The blush background, hot-pink display type, dark-plum handwriting and yellow accents match the source assets. The sound control uses a translucent blush-white surface and dark-plum icon to remain subordinate.
- Image quality and asset fidelity: Source PNGs were converted to 88-quality JPEGs, reducing the two-image payload from about 3.1MB to about 599KB. Visual inspection at 390×844 shows no readable-text loss, haloing or material degradation.
- Copy and content: Lit state contains `To 杨丽` and `吹灭蜡烛，许个愿吧`. Reveal state contains no recipient line and shows the approved Chinese and English blessing.
- Icons and controls: The sound icon comes from Phosphor Icons. The microphone and waveform remain part of the approved image. Transparent semantic buttons make the visible microphone and candle areas functional.
- Accessibility: All controls have Chinese accessible names, tap targets exceed 44px, focus indicators exist in the lit state, reduced motion is supported, and the microphone-denied path provides a visible fallback message.

## Findings

- [Resolved P2] Candle focus outline remained visible after reveal.
  - Evidence: The initial 390×844 reveal capture showed a large yellow outline around the invisible candle hit area.
  - Impact: It obscured the blessing and broke the poster illusion.
  - Fix: Hide microphone and candle hit areas after the reveal transition while retaining their lit-state keyboard focus indicators.

- [Accepted P3] Sound control is not present in the source visual.
  - Evidence: The implementation adds one 38px translucent control at the top-right.
  - Rationale: The user approved a sound toggle; its treatment follows the source palette and does not alter the main hierarchy.

## Focused Region Comparison

A separate crop was not needed. At the 390×844 full-view comparison scale, the recipient lettering, candle, cake texture, bottom instruction, reveal copy and added sound icon are all individually readable. The microphone fallback state was inspected separately at the same viewport.

## Patches Since First QA Pass

- Hidden candle and microphone hit areas after reveal to remove persistent focus chrome.
- Replaced 1.5–1.6MB PNG assets with visually equivalent 293–306KB JPEG assets.
- Verified microphone-unavailable fallback in the in-app browser.

## Remaining Test Gap

- The in-app browser does not expose microphone input, so real acoustic blow detection must be checked once on a physical phone after GitHub Pages deployment. The permission failure and candle-tap fallback paths are verified.

final result: passed
