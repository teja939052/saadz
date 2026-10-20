import { useEffect, useRef } from "react";
import { buildTextPoints } from "../../utils/glyph.js";

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - p, 3);

/**
 * Opening sequence: a scattered star field gathers and forms the name,
 * then dissolves into the site. (Astra-style title gather.)
 */
export default function Opening({ onDone }) {
  const canvasRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let raf = 0;
    let start = 0;
    let particles = [];

    const COUNT = 2300;
    const DURATION = 3600;

    function build() {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const size = Math.min(H * 0.28, W * 0.88);
      const points = buildTextPoints(
        "SADAA",
        W,
        H,
        COUNT,
        `700 ${size}px "Cinzel Decorative", "Cinzel", Georgia, serif`,
        0.48,
        "0.1em"
      );

      particles = [];
      for (let i = 0; i < COUNT; i++) {
        const target = points[i % Math.max(1, points.length)] || { x: W / 2, y: H / 2 };
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.max(W, H) * (0.22 + Math.random() * 0.72);
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
        });
      }
    }

    function frame(now) {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / DURATION);
      drawFrame(t);
    }

    function drawFrame(t) {
      const fade = t > 0.86 ? 1 - (t - 0.86) / 0.14 : 1;

      ctx.clearRect(0, 0, W, H);

      // soft gold glow behind the forming name
      const glow = clamp(0.18 + (t - 0.55) / 0.35);
      if (glow > 0) {
        ctx.save();
        ctx.globalAlpha = 0.16 * glow * fade;
        ctx.filter = "blur(18px)";
        ctx.fillStyle = "#f0c27c";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const size = Math.min(H * 0.28, W * 0.88);
        ctx.font = `700 ${size}px "Cinzel Decorative", "Cinzel", Georgia, serif`;
        if ("letterSpacing" in ctx) ctx.letterSpacing = "0.1em";
        ctx.fillText("SADAA", W / 2, H * 0.48);
        ctx.restore();
      }

      // light sweep travelling across the formed name
      const sweepX = -W * 0.2 + (t / 0.86) * W * 1.4;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        const local = clamp((t - 0.08 - p.delay) / 0.55);
        const e = easeOut(local);

        // swirl the start position around the target as it flies in
        const swirl = (1 - e) * p.spin;
        const cs = Math.cos(swirl);
        const sn = Math.sin(swirl);
        const ox = p.sx - p.tx;
        const oy = p.sy - p.ty;
        const rx = ox * cs - oy * sn;
        const ry = ox * sn + oy * cs;

        let x = p.tx + rx * (1 - e);
        let y = p.ty + ry * (1 - e);

        p.tw += p.twSpeed;
        const twinkle = 0.6 + 0.4 * Math.sin(p.tw);

        const near = 1 - Math.min(1, Math.abs(x - sweepX) / (W * 0.09));
        const boost = near * near * 0.9;

        ctx.globalAlpha = (0.5 + 0.5 * e) * twinkle * fade;
        ctx.fillStyle = boost > 0.05 ? "#fff3d6" : "#f4d190";
        ctx.beginPath();
        ctx.arc(x, y, p.r * (0.7 + 0.6 * e) * (1 + boost * 0.8), 0, 6.2832);
        ctx.fill();
      }
      ctx.restore();

    }

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
        start = 0;
      }, 200);
    };

    const forced = new URLSearchParams(window.location.search).get("t");
    const fontReady = Promise.race([
      document.fonts.load('700 80px "Cinzel Decorative"').catch(() => {}),
      new Promise((r) => setTimeout(r, 1200)),
    ]);
    fontReady.then(() => {
      build();
      if (forced !== null) {
        drawFrame(Math.min(1, Math.max(0, Number(forced))));
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
  }, [onDone]);

  return (
    <div className="opening" onClick={onDone} role="button" tabIndex={-1} aria-label="Skip intro">
      <canvas ref={canvasRef} className="opening-canvas" />
      <p className="opening-caption">the stars are gathering…</p>
    </div>
  );
}
