import { useEffect, useRef } from "react";
import { buildTextPoints } from "../utils/glyph.js";

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Live star field: most stars hold the shape of the name and breathe,
 * the rest drift as background dust. The pointer bends the letters —
 * stars near the cursor are pushed away and swirl, then spring back.
 * With `gather={false}` the name is not formed yet — only scattered stars.
 */
export default function StarField({ label = "SADAA", nameAlpha = 0.9, dust = 240, gather = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let raf = 0;
    let t = 0;
    let nameStars = [];
    let bgStars = [];

    const mouse = { x: -9999, y: -9999, active: false };

    function build() {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, window.innerWidth || rect.width);
      H = Math.max(1, window.innerHeight || rect.height);

      // make sure the field always covers the viewport, whatever the CSS does
      canvas.style.position = "fixed";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.zIndex = "0";
      canvas.style.pointerEvents = "none";

      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const size = Math.min(H * 0.26, W * 0.62);
      const points = gather
        ? buildTextPoints(
            label,
            W,
            H,
            1100,
            `400 ${size}px "Dune Rise", "Cinzel Decorative", "Cinzel", Georgia, serif`,
            0.46,
            "0.1em"
          )
        : [];

      nameStars = points.map((p) => ({
        x: p.x + (Math.random() - 0.5) * 2.2,
        y: p.y + (Math.random() - 0.5) * 2.2,
        r: 0.6 + Math.random() * 1.5,
        a: 0.35 + Math.random() * 0.65,
        tw: Math.random() * Math.PI * 2,
        tws: 0.015 + Math.random() * 0.05,
        ox: 0,
        oy: 0,
      }));

      bgStars = Array.from({ length: dust }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 1.3,
        a: 0.22 + Math.random() * 0.55,
        tw: Math.random() * Math.PI * 2,
        tws: 0.01 + Math.random() * 0.04,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.04 - Math.random() * 0.1,
        px: 0,
        py: 0,
      }));
    }

    const frameSkip = 28; // ~30fps — the field is slow; this halves the work
    let lastFrame = 0;

    function draw(now) {
      raf = requestAnimationFrame(draw);
      if (now - lastFrame < frameSkip) return;
      lastFrame = now;
      t += 2;
      ctx.clearRect(0, 0, W, H);

      const breath = 0.78 + 0.18 * Math.sin(t * 0.012);
      const R = Math.max(110, Math.min(W, H) * 0.2);

      // drifting background dust
      for (const s of bgStars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.y < -4) {
          s.y = H + 4;
          s.x = Math.random() * W;
        }
        if (s.x < -4) s.x = W + 4;
        if (s.x > W + 4) s.x = -4;
        s.tw += s.tws;

        const dx = s.x - mouse.x;
        const dy = s.y - mouse.y;
        const d = Math.hypot(dx, dy);
        let ox = 0;
        let oy = 0;
        if (mouse.active && d < R * 0.8 && d > 0.01) {
          const f = 1 - d / (R * 0.8);
          ox += (dx / d) * f * f * 16;
          oy += (dy / d) * f * f * 16;
        }
        s.px += (ox - s.px) * 0.12;
        s.py += (oy - s.py) * 0.12;

        const twinkle = 0.6 + 0.4 * Math.abs(Math.sin(s.tw));
        ctx.globalAlpha = s.a * twinkle;
        ctx.fillStyle = "#ffe7bb";
        ctx.beginPath();
        ctx.arc(s.x + s.px, s.y + s.py, s.r, 0, 6.2832);
        ctx.fill();

        if (s.r > 1.05) {
          ctx.globalAlpha = clamp(s.a * twinkle * 0.9);
          ctx.fillStyle = "#fffaf0";
          ctx.beginPath();
          ctx.arc(s.x + s.px, s.y + s.py, s.r * 0.4, 0, 6.2832);
          ctx.fill();
        }
      }

      // the name, made of stars
      for (const s of nameStars) {
        s.tw += s.tws;

        const dx = s.x - mouse.x;
        const dy = s.y - mouse.y;
        const d = Math.hypot(dx, dy);
        let tx = 0;
        let ty = 0;
        if (mouse.active && d < R && d > 0.01) {
          const f = 1 - d / R;
          const push = f * f * 34;
          const swirl = f * 0.9;
          const ux = dx / d;
          const uy = dy / d;
          tx = ux * push - uy * push * swirl;
          ty = uy * push + ux * push * swirl;
        }
        s.ox += (tx - s.ox) * 0.12;
        s.oy += (ty - s.oy) * 0.12;

        const x = s.x + s.ox;
        const y = s.y + s.oy;

        // wave of brightness travelling through the letters
        const wave = 0.5 + 0.5 * Math.sin(t * 0.05 - x * 0.012);
        const twinkle = 0.78 + 0.22 * Math.sin(s.tw);
        const alpha = clamp(s.a * nameAlpha * breath * twinkle * (0.72 + 0.28 * wave));

        // soft bloom — only on the brighter stars
        if (alpha > 0.4) {
          ctx.globalAlpha = alpha * 0.26;
          ctx.fillStyle = "#f2c877";
          ctx.beginPath();
          ctx.arc(x, y, s.r * 3.6, 0, 6.2832);
          ctx.fill();
        }

        // golden body
        ctx.globalAlpha = alpha;
        ctx.fillStyle = wave > 0.62 ? "#fff0cb" : "#f7d99b";
        ctx.beginPath();
        ctx.arc(x, y, s.r * 1.05, 0, 6.2832);
        ctx.fill();

        // crisp white pinpoint for clarity
        if (s.r > 1.15) {
          ctx.globalAlpha = Math.min(1, alpha * 1.3);
          ctx.fillStyle = "#fffdf6";
          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.65, s.r * 0.42), 0, 6.2832);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
    }

    function onMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }
    function onLeave() {
      mouse.active = false;
    }

    let resizeTimer;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
      }, 200);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);

    const fontReady = Promise.race([
      Promise.all([
        document.fonts.load('400 80px "Dune Rise"').catch(() => {}),
        document.fonts.load('700 80px "Cinzel Decorative"').catch(() => {}),
      ]).catch(() => {}),
      new Promise((r) => setTimeout(r, 1400)),
    ]);
    fontReady.then(() => {
      build();
      raf = requestAnimationFrame(draw);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, [label, nameAlpha, dust, gather]);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}
