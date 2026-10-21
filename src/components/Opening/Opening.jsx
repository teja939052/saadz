import { useEffect, useRef, useState } from "react";
import { buildTextPoints } from "../../utils/glyph.js";

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - p, 3);

/**
 * Opening: a sky of scattered stars waits for a tap. On the tap every star
 * rushes inward, swirling, until the whole field has become the name.
 * (Astra-style gather.)
 */
export default function Opening({ onDone }) {
  const canvasRef = useRef(null);
  const started = useRef(false);
  const startedAt = useRef(0);
  const finished = useRef(false);
  const onDoneRef = useRef(onDone);
  const [tapped, setTapped] = useState(false);

  onDoneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let raf = 0;
    let particles = [];

    const COUNT = 2600;
    const DURATION = 3400;
    const HOLD = 1100;

    function build() {
      const rect = canvas.getBoundingClientRect();
      W = rect.width || window.innerWidth;
      H = rect.height || window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const size = Math.min(H * 0.26, W * 0.62);
      const points = buildTextPoints(
        "SADAA",
        W,
        H,
        COUNT,
        `400 ${size}px "Dune Rise", "Cinzel Decorative", "Cinzel", Georgia, serif`,
        0.46,
        "0.1em"
      );

      particles = [];
      for (let i = 0; i < COUNT; i++) {
        const target = points[i % Math.max(1, points.length)] || { x: W / 2, y: H / 2 };
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.max(W, H) * (0.24 + Math.random() * 0.76);
        particles.push({
          tx: target.x,
          ty: target.y,
          sx: target.x + Math.cos(ang) * dist,
          sy: target.y + Math.sin(ang) * dist,
          r: 0.6 + Math.random() * 1.7,
          tw: Math.random() * Math.PI * 2,
          twSpeed: 0.02 + Math.random() * 0.05,
          delay: Math.random() * 0.3,
          spin: (Math.random() - 0.5) * 2.4,
          phase: Math.random() * Math.PI * 2,
          drift: 5 + Math.random() * 16,
        });
      }
    }

    const frameSkip = 28; // waiting screen draws at ~30fps; the gather itself runs full speed
    let lastFrame = 0;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - lastFrame < (started.current ? 0 : frameSkip)) return;
      lastFrame = now;

      if (started.current && !startedAt.current) startedAt.current = now;
      const t = started.current ? clamp((now - startedAt.current) / DURATION) : 0;

      draw(t, now);

      if (started.current && t >= 1) {
        if (!finished.current) {
          finished.current = true;
          window.setTimeout(() => onDoneRef.current(), HOLD);
        }
        cancelAnimationFrame(raf);
      }
    }

    function draw(t, now) {
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // light sweep travelling across the formed name
      const sweepX = -W * 0.2 + (t / 0.9) * W * 1.4;

      for (const p of particles) {
        const local = clamp((t - 0.05 - p.delay) / 0.6);
        const e = easeOut(local);

        const swirl = (1 - e) * p.spin;
        const cs = Math.cos(swirl);
        const sn = Math.sin(swirl);
        const ox = p.sx - p.tx;
        const oy = p.sy - p.ty;
        const rx = ox * cs - oy * sn;
        const ry = ox * sn + oy * cs;

        let x = p.tx + rx * (1 - e);
        let y = p.ty + ry * (1 - e);

        // before (and during) the gather the free stars drift and breathe
        const free = 1 - e;
        if (free > 0.01) {
          x += Math.sin(now * 0.0006 + p.phase) * p.drift * free;
          y += Math.cos(now * 0.00045 + p.phase) * p.drift * 0.7 * free;
        }

        p.tw += p.twSpeed;
        const twinkle = 0.74 + 0.26 * Math.sin(p.tw);

        const near = 1 - Math.min(1, Math.abs(x - sweepX) / (W * 0.09));
        const boost = near * near * clamp((t - 0.5) / 0.4);

        const r = p.r * (0.8 + 0.6 * e);
        const alpha = (0.7 + 0.3 * e) * twinkle;

        // bloom — only on stars near the sweep or nearly landed
        if (boost > 0.04 || e > 0.85) {
          ctx.globalAlpha = alpha * 0.24;
          ctx.fillStyle = boost > 0.05 ? "#fff3d6" : "#e8b45f";
          ctx.beginPath();
          ctx.arc(x, y, r * 3.8, 0, 6.2832);
          ctx.fill();
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = boost > 0.05 ? "#fff8e8" : "#f8d89e";
        ctx.beginPath();
        ctx.arc(x, y, r * (1 + boost * 0.7), 0, 6.2832);
        ctx.fill();

        if (r > 0.9) {
          ctx.globalAlpha = Math.min(1, alpha * 1.25);
          ctx.fillStyle = "#fffdf4";
          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.65, r * 0.4), 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const wasStarted = started.current;
        const elapsed = startedAt.current ? performance.now() - startedAt.current : 0;
        build();
        startedAt.current = wasStarted && !finished.current ? performance.now() - elapsed : 0;
      }, 200);
    };

    const forced = new URLSearchParams(window.location.search).get("t");
    const fontReady = Promise.race([
      Promise.all([
        document.fonts.load('400 80px "Dune Rise"').catch(() => {}),
        document.fonts.load('700 80px "Cinzel Decorative"').catch(() => {}),
      ]).catch(() => {}),
      new Promise((r) => setTimeout(r, 1400)),
    ]);
    fontReady.then(() => {
      build();
      if (forced !== null) {
        const f = clamp(Number(forced) || 0);
        started.current = true;
        startedAt.current = performance.now() - f * DURATION;
        draw(f, performance.now());
      } else {
        raf = requestAnimationFrame(frame);
      }
    });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  function begin() {
    if (started.current) return;
    started.current = true;
    setTapped(true);
  }

  return (
    <div
      className="opening"
      onClick={begin}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          begin();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Open the surprise"
    >
      <canvas ref={canvasRef} className="opening-canvas" />
      {!tapped ? (
        <>
          <p className="opening-caption opening-prompt">tap anywhere to open</p>
          <span className="opening-hint" aria-hidden="true">✦</span>
        </>
      ) : (
        <p className="opening-caption opening-gathering">the stars are gathering…</p>
      )}
    </div>
  );
}
