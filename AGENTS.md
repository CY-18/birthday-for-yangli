# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Confirmed Birthday Experience

- Mobile-first viewport: 390 × 844, with responsive support through 430px wide.
- Lit-state visual source: `/Users/YangMac/.codex/generated_images/019f2e9d-bf66-7443-b2ba-9235ab4ea638/call_o8anFJ2IHw416LvK3IOfTijO.png`.
- Reveal-state visual source: `/Users/YangMac/.codex/generated_images/019f2e9d-bf66-7443-b2ba-9235ab4ea638/call_ZbcidV2byDsMJe4F3hzM92cz.png`.
- Lit state keeps `To 杨丽`; reveal state must not show it.
- Reveal copy: `又长大一岁，但你仍然是时间流逝中的例外。` with `ANOTHER YEAR. STILL THE EXCEPTION.` as supporting text.
- Use microphone blow detection with candle-tap fallback.
- Prioritize blow-detection sensitivity on phones: request unprocessed audio, use float samples, and tolerate brief signal dips.
- Keep the base poster free of any baked-in flame. Animate only a tightly cropped, fully opaque flame above the wick; compute its position from the poster's cover crop so no full-canvas frame or surrounding artwork moves.
- No continuous background music; play the short slow-jazz birthday arrangement once on reveal and provide a sound toggle.
