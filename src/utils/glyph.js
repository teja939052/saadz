/* Sample points inside rendered text (used by the story renderers). */
export function buildTextPoints(text, W, H, maxPoints, font, yOffset = 0.5, tracking = "0em") {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font;
  if ("letterSpacing" in ctx) ctx.letterSpacing = tracking;
  ctx.fillText(text, W / 2, H * yOffset);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4;
      if (data[i + 3] > 150) pts.push({ x, y });
    }
  }
  const step = Math.max(1, Math.floor(pts.length / maxPoints));
  return pts.filter((_, i) => i % step === 0);
}
