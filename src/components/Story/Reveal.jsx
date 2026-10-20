import { useEffect, useRef, useState } from "react";

const imageCache = new Map();

function loadImage(src) {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      })
    );
  }
  return imageCache.get(src);
}

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (p) => 1 - Math.pow(1 - p, 3);

/* ── HD pass: unsharp mask + gentle grade ───────────────────────── */
function sharpen(canvas, amount) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const small = document.createElement("canvas");
  small.width = Math.max(1, Math.round(w / 5));
  small.height = Math.max(1, Math.round(h / 5));
  const sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(canvas, 0, 0, small.width, small.height);

  const big = document.createElement("canvas");
  big.width = w;
  big.height = h;
  const bctx = big.getContext("2d", { willReadFrequently: true });
  bctx.imageSmoothingEnabled = true;
  bctx.imageSmoothingQuality = "high";
  bctx.drawImage(small, 0, 0, w, h);

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const blur = bctx.getImageData(0, 0, w, h).data;
  const contrast = 1.1;
  const k = 128 * (contrast - 1);
  const sat = 1.12;

  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const orig = d[i + c];
      const soft = blur[i + c];
      let v = orig + amount * (orig - soft);
      v = v * contrast + k;
      const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      v = l + (v - l) * sat;
      d[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/* ── Straighten + cover-fit the photo into the frame ─────────────── */
function prepareSource(img, W, H, rotate, focus) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#0b0710";
  ctx.fillRect(0, 0, W, H);

  const rad = ((rotate || 0) * Math.PI) / 180;
  const quarter = Math.abs((rotate || 0) % 180) === 90;

  // on-screen (post-rotation) dimensions
  const rotW = quarter ? img.naturalHeight : img.naturalWidth;
  const rotH = quarter ? img.naturalWidth : img.naturalHeight;
  const scale = Math.max(W / rotW, H / rotH);

  // dimensions while drawing (pre-rotation)
  const drawW = (quarter ? rotH : rotW) * scale;
  const drawH = (quarter ? rotW : rotH) * scale;

  const fx = focus ? focus.x : 50;
  const fy = focus ? focus.y : 50;
  const offX = (0.5 - fx / 100) * (rotW * scale - W);
  const offY = (0.5 - fy / 100) * (rotH * scale - H);

  ctx.save();
  ctx.translate(W / 2 + offX, H / 2 + offY);
  ctx.rotate(rad);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  sharpen(canvas, 0.85);
  return canvas;
}

/* ── Sample the photo into a grid of cells ───────────────────────── */
function sampleGrid(source, cols, rows) {
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const cells = [];
  const buckets = new Map();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3] / 255;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const cell = { x, y, lum, color: `rgb(${r},${g},${b})` };
      cells.push(cell);
      if (!buckets.has(cell.color)) buckets.set(cell.color, []);
      buckets.get(cell.color).push(cell);
    }
  }
  return { cells, buckets, alpha: cells.length ? cells[0] : null };
}

/* ── Glyph sampling: points inside the digits "18" ──────────────── */
function buildGlyphPoints(text, W, H, maxPoints) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const size = Math.min(H * 0.66, W * 1.05);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${size}px "Playfair Display", Georgia, "Times New Roman", serif`;
  ctx.fillText(text, W / 2, H * 0.5);
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

/* ── Shape helpers ───────────────────────────────────────────────── */
function starGlyph(ctx, x, y, r, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.3;
    const a = (Math.PI * 2 * i) / (points * 2) - Math.PI / 2;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function eightPointStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let k = 0; k < 2; k++) {
    const a = (k * Math.PI) / 4;
    const cx = x + Math.cos(a) * 0;
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(a);
    ctx.rect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44);
    ctx.restore();
  }
  ctx.closePath();
}

function twinkleField(ctx, W, H, t, count, seedBase) {
  for (let i = 0; i < count; i++) {
    const s = seedBase + i * 12.9898;
    const x = ((Math.sin(s) * 43758.5453) % 1 + 1) % 1 * W;
    const y = ((Math.sin(s * 1.7) * 21378.1234) % 1 + 1) % 1 * H;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 2 + i));
    const r = 1.2 + (i % 4) * 0.9;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, 226, 168, ${0.5 * tw * clamp(t * 2)})`;
    starGlyph(ctx, x, y, r * 2.4, 4);
    ctx.fill();
    ctx.restore();
  }
}

/* ── Technique 1: dot matrix (alaacode style) ────────────────────── */
function renderDots(ctx, source, W, H, t, prep) {
  if (!prep.dots) prep.dots = sampleGrid(source, 66, 82);
  const { buckets } = prep.dots;
  const cw = W / 66;
  const ch = H / 82;
  const base = Math.min(cw, ch);
  ctx.clearRect(0, 0, W, H);

  // faint ghost of the photo so the shape reads through the dots
  ctx.globalAlpha = 0.16 * ease(clamp(t * 2));
  ctx.drawImage(source, 0, 0, W, H);
  ctx.globalAlpha = 1;

  for (const [color, cells] of buckets) {
    ctx.fillStyle = color;
    for (const cell of cells) {
      const dx = cell.x - 33;
      const dy = (cell.y - 50) * 0.75;
      const d = Math.hypot(dx, dy) / 52;
      const p = clamp((t - d * 0.4) / 0.6);
      if (p <= 0) continue;
      const tone = Math.pow(cell.lum, 0.62);
      const r = base * 0.56 * (0.22 + 0.78 * tone) * ease(p);
      if (r < 0.2) continue;
      ctx.beginPath();
      ctx.arc((cell.x + 0.5) * cw, (cell.y + 0.5) * ch, r, 0, 6.2832);
      ctx.fill();
    }
  }
}

/* ── Technique 2: star pointillism ───────────────────────────────── */
function renderStars(ctx, source, W, H, t, prep) {
  if (!prep.stars) prep.stars = sampleGrid(source, 30, 38);
  const { buckets } = prep.stars;
  const cw = W / 30;
  const ch = H / 38;
  const base = Math.min(cw, ch);
  ctx.clearRect(0, 0, W, H);

  ctx.globalAlpha = 0.24 * ease(clamp(t * 2));
  ctx.drawImage(source, 0, 0, W, H);
  ctx.globalAlpha = 1;

  for (const [color, cells] of buckets) {
    ctx.fillStyle = color;
    for (const cell of cells) {
      const p = clamp((t - (cell.y / 38) * 0.35) / 0.65);
      if (p <= 0) continue;
      const tone = Math.pow(cell.lum, 0.55);
      const r = base * 0.72 * (0.3 + 0.7 * tone) * ease(p);
      if (r < 0.3) continue;
      starGlyph(ctx, (cell.x + 0.5) * cw, (cell.y + 0.5) * ch, r, 4);
      ctx.fill();
    }
  }
  twinkleField(ctx, W, H, t, 46, 3.7);
}

/* ── Technique 3: crescent moon + 8-point lattice ────────────────── */
function renderMoon(ctx, source, W, H, t, prep) {
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 0.14 + 0.1 * t;
  ctx.drawImage(source, 0, 0, W, H);
  ctx.globalAlpha = 1;

  const step = Math.max(46, W / 5.5);
  ctx.save();
  ctx.strokeStyle = `rgba(233, 197, 140, ${0.16 + 0.14 * t})`;
  ctx.lineWidth = 1;
  for (let row = -1; row * step < H + step; row++) {
    for (let col = -1; col * step < W + step; col++) {
      const x = col * step + (Math.abs(row % 2) * step) / 2;
      const y = row * step;
      eightPointStar(ctx, x, y, step * 0.46);
      ctx.stroke();
    }
  }
  ctx.restore();

  const p = ease(clamp(t * 1.15));
  const cx = W * 0.5;
  const cy = H * 0.5;
  const R = Math.min(W, H) * 0.72 * p;
  const off = R * 0.52;
  const innerR = R * 0.94;

  // crescent = outer disc minus an offset inner disc
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.arc(cx + off, cy - off * 0.42, innerR, 0, Math.PI * 2);
  ctx.clip("evenodd");
  ctx.drawImage(source, 0, 0, W, H);
  ctx.restore();

  // gold rim along the crescent edge
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(245, 215, 156, ${0.5 * p})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + off, cy - off * 0.42, innerR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.25);
  g.addColorStop(0, `rgba(255, 214, 150, ${0.2 * p})`);
  g.addColorStop(1, "rgba(255, 214, 150, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  twinkleField(ctx, W, H, t, 38, 11.2);
}

/* ── Technique 4: 3D flip tiles ──────────────────────────────────── */
function renderTiles(ctx, source, W, H, t) {
  ctx.clearRect(0, 0, W, H);
  const cols = 9;
  const rows = 12;
  const tw = W / cols;
  const th = H / rows;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = Math.hypot(x - (cols - 1) / 2, (y - (rows - 1) / 2) * 0.6) / (cols * 0.7);
      const p = clamp((t - d * 0.35) / 0.65);
      if (p <= 0) continue;
      const flip = Math.abs(Math.cos(p * Math.PI));
      const dh = th * flip;
      const sx = x * tw;
      const sy = y * th;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p * 1.6);
      ctx.drawImage(source, sx, sy, tw, th, sx, sy + (th - dh) / 2, tw, dh);
      if (flip < 0.5) {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(255, 220, 160, ${0.1 * (1 - flip * 2)})`;
        ctx.fillRect(sx, sy + (th - dh) / 2, tw, dh);
      }
      ctx.restore();
    }
  }
}

/* ── Technique 5: light rays + bokeh ─────────────────────────────── */
function renderRays(ctx, source, W, H, t, prep) {
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(source, 0, 0, W, H);
  ctx.fillStyle = `rgba(14, 9, 17, ${0.4 - 0.15 * t})`;
  ctx.fillRect(0, 0, W, H);

  const fx = W * 0.5;
  const fy = H * 0.3;
  const rays = 20;
  const len = Math.hypot(W, H);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + t * 0.18;
    const wdt = 0.022 + 0.016 * Math.abs(Math.sin(i * 1.9));
    const g = ctx.createLinearGradient(fx, fy, fx + Math.cos(a) * len, fy + Math.sin(a) * len);
    g.addColorStop(0, `rgba(255, 208, 126, ${0.075 * ease(clamp(t * 1.2))})`);
    g.addColorStop(1, "rgba(255, 208, 126, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.arc(fx, fy, len, a - wdt, a + wdt);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  if (!prep.bokeh) {
    prep.bokeh = Array.from({ length: 34 }, (_, i) => ({
      x: ((Math.sin(i * 7.31) * 10000) % 1 + 1) % 1,
      y: ((Math.sin(i * 3.17) * 10000) % 1 + 1) % 1,
      r: 4 + ((i * 7) % 13),
      sp: 0.02 + ((i * 3) % 7) * 0.008,
    }));
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const b of prep.bokeh) {
    const y = ((b.y - t * b.sp) % 1 + 1) % 1;
    const x = b.x * W + Math.sin(t * 1.4 + b.r) * 8;
    const yy = y * H;
    const g = ctx.createRadialGradient(x, yy, 0, x, yy, b.r * 2.6);
    g.addColorStop(0, `rgba(255, 226, 176, ${0.24 * ease(clamp(t * 1.5))})`);
    g.addColorStop(1, "rgba(255, 226, 176, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, yy, b.r * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ── Technique 6: particles spell "18", then morph into her face ─── */
function renderEighteen(ctx, source, W, H, t, prep) {
  ctx.clearRect(0, 0, W, H);

  if (!prep.glyph) {
    prep.glyph = buildGlyphPoints("18", W, H, 2200);
    prep.photo = sampleGrid(source, 72, 90);
  }
  const glyph = prep.glyph;
  const allCells = prep.photo.cells;
  const count = Math.min(glyph.length, allCells.length);
  if (!count) return;
  // deterministic random spread so the dots cover the photo evenly (no stripes)
  if (!prep.spread) {
    const order = allCells.map((_, i) => i);
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    prep.spread = order.slice(0, count).map((i) => allCells[i]);
  }
  const photoCells = prep.spread;
  const cw = W / 72;
  const ch = H / 90;

  const p1 = clamp(t / 0.55);
  const p2 = clamp((t - 0.55) / 0.45);

  if (p2 > 0) {
    ctx.globalAlpha = 0.18 + 0.78 * ease(p2);
    ctx.drawImage(source, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  ctx.save();
  if (p2 <= 0) ctx.globalCompositeOperation = "lighter";
  else ctx.globalCompositeOperation = "source-over";

  for (let i = 0; i < count; i++) {
    const g = glyph[i];
    const cell = photoCells[i];

    const startX = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const startY = (Math.sin(i * 78.233) * 12345.6789) % 1;
    const sx = Math.abs(startX) * W;
    const sy = Math.abs(startY) * H;

    const e1 = ease(p1);
    let x = sx + (g.x - sx) * e1;
    let y = sy + (g.y - sy) * e1;

    if (p2 > 0) {
      const tx = (cell.x + 0.5) * cw;
      const ty = (cell.y + 0.5) * ch;
      const e2 = ease(p2);
      x += (tx - x) * e2;
      y += (ty - y) * e2;
    }

    const r = p2 > 0 ? 1.1 + cell.lum * 1.3 : 1.6 + cell.lum * 1.7;
    const col = p2 > 0 ? cell.color : "rgba(255, 216, 150, 1)";
    ctx.fillStyle = col;
    ctx.globalAlpha = p2 > 0 ? 0.5 : 0.95;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();
  }
  ctx.restore();

  if (p1 > 0.05 && p2 < 0.98) {
    twinkleField(ctx, W, H, t, 26, 21.7);
  }
}

/* ── Component ───────────────────────────────────────────────────── */
export default function Reveal({ chapter, active }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [sizeKey, setSizeKey] = useState(0);
  const prepRef = useRef({});

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    prepRef.current = {};

    loadImage(chapter.src)
      .then(async (img) => {
        if (!alive) return;
        if (document.fonts && document.fonts.ready) {
          try {
            await document.fonts.ready;
          } catch {
            /* fonts optional */
          }
        }
        if (!alive) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const W = Math.max(1, Math.round(rect.width * dpr));
        const H = Math.max(1, Math.round(rect.height * dpr));
        canvas.width = W;
        canvas.height = H;
        const source = prepareSource(img, W, H, chapter.rotate, chapter.focus);
        prepRef.current = { source, W, H };
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));

    return () => {
      alive = false;
    };
  }, [chapter.src, chapter.rotate, sizeKey]);

  useEffect(() => {
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setSizeKey((k) => k + 1), 220);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const prep = prepRef.current;
    if (!canvas || !prep.source) return;

    const reduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const forced = new URLSearchParams(window.location.search).get("t");
    const duration = 2800;
    let raf = 0;
    let start = 0;

    function draw(t) {
      switch (chapter.technique) {
        case "stars":
          renderStars(ctx, prep.source, prep.W, prep.H, t, prep);
          break;
        case "moon":
          renderMoon(ctx, prep.source, prep.W, prep.H, t, prep);
          break;
        case "tiles":
          renderTiles(ctx, prep.source, prep.W, prep.H, t);
          break;
        case "rays":
          renderRays(ctx, prep.source, prep.W, prep.H, t, prep);
          break;
        case "eighteen":
          renderEighteen(ctx, prep.source, prep.W, prep.H, t, prep);
          break;
        default:
          renderDots(ctx, prep.source, prep.W, prep.H, t, prep);
      }
    }

    function frame(now) {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      draw(t);
      if (t < 1) raf = requestAnimationFrame(frame);
    }

    if (forced !== null) {
      draw(Math.min(1, Math.max(0, Number(forced))));
    } else if (reduced) {
      draw(1);
    } else if (active) {
      raf = requestAnimationFrame(frame);
    } else {
      draw(0);
    }

    return () => cancelAnimationFrame(raf);
  }, [status, active, chapter.technique]);

  return (
    <div className={`reveal ${status}`}>
      <canvas ref={canvasRef} className="reveal-canvas" />
      {status === "loading" && <span className="reveal-loading">developing the photo…</span>}
    </div>
  );
}
