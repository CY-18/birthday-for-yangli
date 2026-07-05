export function positionFlameForCover({
  containerWidth,
  containerHeight,
  sourceWidth,
  sourceHeight,
  rect,
}) {
  const scale = Math.max(
    containerWidth / sourceWidth,
    containerHeight / sourceHeight,
  );
  const offsetX = (containerWidth - sourceWidth * scale) / 2;
  const offsetY = (containerHeight - sourceHeight * scale) / 2;

  return {
    left: offsetX + rect.x * scale,
    top: offsetY + rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}
