import { useEffect, useRef } from "react";

export default function Particles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let raf;
    let t = 0;

    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
    }));

    const shootingStars = [];

    function spawnShootingStar() {
      if (shootingStars.length < 3 && Math.random() < 0.01) {
        shootingStars.push({
          x: Math.random() * w * 0.8 + w * 0.1,
          y: Math.random() * h * 0.3,
          vx: (Math.random() - 0.3) * 6 + 3,
          vy: Math.random() * 2 + 1.5,
          life: 1,
          decay: Math.random() * 0.015 + 0.008,
          trail: [],
        });
      }
    }

    function draw() {
      t++;
      ctx.clearRect(0, 0, w, h);

      stars.forEach((s) => {
        s.twinkle += s.twinkleSpeed;
        const alpha = 0.3 + Math.sin(s.twinkle) * 0.4;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 230, 180, ${Math.max(0.1, alpha)})`;
        ctx.fill();
        s.y += s.speed * 0.3;
        if (s.y > h) s.y = -5;
      });

      spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life -= ss.decay;
        ss.trail.push({ x: ss.x, y: ss.y });
        if (ss.trail.length > 12) ss.trail.shift();

        if (ss.life <= 0 || ss.x > w || ss.y > h) {
          shootingStars.splice(i, 1);
          continue;
        }

        ss.trail.forEach((p, j) => {
          const frac = j / ss.trail.length;
          const alpha = frac * ss.life * 0.7;
          ctx.beginPath();
          ctx.arc(p.x, p.y, frac * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 210, 140, ${alpha})`;
          ctx.fill();
        });

        const grad = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 12);
        grad.addColorStop(0, `rgba(255, 240, 200, ${ss.life})`);
        grad.addColorStop(1, "rgba(255, 200, 100, 0)");
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      const orbs = [
        { x: w * 0.2 + Math.sin(t * 0.008) * 60, y: h * 0.3 + Math.cos(t * 0.01) * 40, r: 120, c: "230,160,68" },
        { x: w * 0.8 + Math.cos(t * 0.006) * 50, y: h * 0.6 + Math.sin(t * 0.009) * 50, r: 150, c: "197,47,109" },
        { x: w * 0.5 + Math.sin(t * 0.004) * 80, y: h * 0.8 + Math.cos(t * 0.007) * 30, r: 100, c: "120,60,180" },
      ];
      orbs.forEach((o) => {
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, `rgba(${o.c}, 0.06)`);
        grad.addColorStop(1, `rgba(${o.c}, 0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}
