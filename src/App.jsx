import { useState, useEffect, useRef } from "react";
import "./App.css";
import MemoriesView from "./components/Memories/MemoriesView.jsx";

const wishes = [
  { language: "English", greeting: "Happy Birthday, Sadaa!", message: "May this new chapter bring you beautiful surprises, brave dreams, and a hundred little reasons to smile." },
  { language: "తెలుగు", greeting: "పుట్టినరోజు శుభాకాంక్షలు, సదా!", message: "నీ జీవితం ఆనందం, ప్రేమ, విజయాలతో నిండిపోవాలి. నీ కలలన్నీ ఒక్కొక్కటిగా నిజం కావాలి!" },
  { language: "हिन्दी", greeting: "जन्मदिन मुबारक हो, सदा!", message: "तुम्हारी ज़िंदगी खुशियों, प्यार और खूबसूरत यादों से भरी रहे। तुम्हारे सारे सपने पूरे हों!" },
  { language: "தமிழ்", greeting: "இனிய பிறந்தநாள் வாழ்த்துகள், சதா!", message: "உன் வாழ்க்கை மகிழ்ச்சி, அன்பு, வெற்றி நிறைந்ததாக இருக்கட்டும். உன் கனவுகள் எல்லாம் நனவாகட்டும்!" },
  { language: "ಕನ್ನಡ", greeting: "ಹುಟ್ಟುಹಬ್ಬದ ಶುಭಾಶಯಗಳು, ಸದಾ!", message: "ನಿನ್ನ ಜೀವನ ಸಂತೋಷ, ಪ್ರೀತಿ ಮತ್ತು ಯಶಸ್ಸಿನಿಂದ ತುಂಬಿರಲಿ. ನಿನ್ನ ಕನಸುಗಳೆಲ್ಲ ನನಸಾಗಲಿ!" },
  { language: "മലയാളം", greeting: "ജന്മദിനാശംസകൾ, സദാ!", message: "നിന്റെ ജീവിതം സന്തോഷവും സ്നേഹവും മനോഹരമായ ഓർമ്മകളും കൊണ്ട് നിറയട്ടെ!" },
  { language: "Français", greeting: "Joyeux anniversaire, Sadaa !", message: "Que cette nouvelle année t'apporte du bonheur, de belles surprises et des rêves qui deviennent réalité." },
  { language: "Español", greeting: "¡Feliz cumpleaños, Sadaa!", message: "Que tu vida esté llena de alegría, cariño, aventuras bonitas y sueños cumplidos." },
  { language: "日本語", greeting: "お誕生日おめでとう、サダー！", message: "笑顔と幸せがたくさんあふれる、素敵な一年になりますように。" },
  { language: "한국어", greeting: "생일 축하해요, Sadaa!", message: "행복과 사랑, 아름다운 추억으로 가득한 한 해가 되길 바라요." },
];

// ─── Particle system ──────────────────────────────────────────────
function Particles() {
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

      // Stars
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

      // Shooting stars
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

        // Trail
        ss.trail.forEach((p, j) => {
          const frac = j / ss.trail.length;
          const alpha = frac * ss.life * 0.7;
          ctx.beginPath();
          ctx.arc(p.x, p.y, frac * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 210, 140, ${alpha})`;
          ctx.fill();
        });

        // Head glow
        const grad = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 12);
        grad.addColorStop(0, `rgba(255, 240, 200, ${ss.life})`);
        grad.addColorStop(1, "rgba(255, 200, 100, 0)");
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Ambient glow orbs
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

// ─── Confetti burst ───────────────────────────────────────────────
function ConfettiBurst({ trigger }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const colors = ["#f0c27c", "#d99554", "#e05a8a", "#c084fc", "#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#f87171", "#a78bfa"];
    const shapes = ["✦", "♡", "✧", "●", "◆", "★", "✿", "♪"];
    const newPieces = Array.from({ length: 80 }, (_, i) => ({
      id: Date.now() + i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 50 + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 20,
      vy: -Math.random() * 18 - 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: Math.random() * 18 + 10,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 20,
      life: 1,
    }));
    setPieces(newPieces);

    let frame;
    let start = performance.now();
    function animate(now) {
      const elapsed = (now - start) / 16;
      setPieces((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.15,
            y: p.y + p.vy * 0.15,
            vy: p.vy + 0.5,
            rot: p.rot + p.rotV,
            life: p.life - 0.012,
          }))
          .filter((p) => p.life > 0)
      );
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [trigger]);

  return (
    <div className="confetti-container">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            color: p.color,
            fontSize: p.size,
            opacity: p.life,
            transform: `rotate(${p.rot}deg) scale(${p.life})`,
          }}
        >
          {p.shape}
        </span>
      ))}
    </div>
  );
}

// ─── Candle flame ─────────────────────────────────────────────────
function Candle({ delay = 0 }) {
  return (
    <div className="candle" style={{ animationDelay: `${delay}s` }}>
      <div className="flame">
        <div className="flame-inner" />
        <div className="flame-glow" />
      </div>
      <div className="wick" />
      <div className="wax" />
    </div>
  );
}

// ─── Cake ─────────────────────────────────────────────────────────
function Cake({ lit }) {
  return (
    <div className={`cake ${lit ? "cake-lit" : ""}`}>
      <div className="candles-row">
        {[0, 1, 2, 3, 4].map((i) => (
          <Candle key={i} delay={i * 0.15} />
        ))}
      </div>
      <div className="cake-layer cake-top">
        <div className="icing" />
        <div className="drip drip-1" /><div className="drip drip-2" /><div className="drip drip-3" />
        <div className="drip drip-4" /><div className="drip drip-5" />
      </div>
      <div className="cake-layer cake-mid">
        <div className="icing" />
        <div className="drip drip-1" /><div className="drip drip-3" /><div className="drip drip-5" />
      </div>
      <div className="cake-layer cake-bottom" />
      <div className="plate" />
      {lit && <div className="cake-glow" />}
    </div>
  );
}

// ─── Wishing screen ───────────────────────────────────────────────
function WishScreen({ onWish }) {
  const [blown, setBlown] = useState(false);

  function blowCandles() {
    setBlown(true);
    setTimeout(() => onWish(), 1800);
  }

  return (
    <div className="wish-screen">
      <p className="eyebrow wish-eyebrow">NOW, MAKE A WISH</p>
      <h2 className="wish-text">Close your eyes...<br/>and make a wish</h2>
      <Cake lit={!blown} />
      {blown && <div className="smoke"><span>☁</span><span>☁</span><span>☁</span></div>}
      <button className="primary blow-btn" onClick={blowCandles} disabled={blown}>
        {blown ? "✨ Wish sealed ✨" : "🌬️ Blow the candles"}
      </button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState("intro"); // intro | wish | experience | memories
  const [index, setIndex] = useState(0);
  const [showNote, setShowNote] = useState(false);
  const [hearts, setHearts] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const wish = wishes[index];

  function nextWish() {
    setIndex((c) => (c + 1) % wishes.length);
    setHearts(true);
    setConfetti((c) => c + 1);
    setTimeout(() => setHearts(false), 1200);
  }

  return (
    <main className="page">
      <Particles />
      <ConfettiBurst trigger={confetti} />

      {phase === "intro" && (
        <section className="intro panel slide-up">
          <div className="seal-ring">
            <div className="seal">✦</div>
            <div className="seal-pulse" />
          </div>
          <p className="eyebrow">A LITTLE SOMETHING MADE JUST FOR YOU</p>
          <h1 className="intro-title">
            For <span>Sadaa</span>
          </h1>
          <p className="subtitle">Some wishes deserve more than a message.</p>
          <button className="primary glow-btn" onClick={() => setPhase("wish")}>
            Open your surprise <span className="btn-arrow">↗</span>
          </button>
          <p className="tiny">best experienced with sound on ✨</p>
          <p className="credit">handmade for you — by <span>BHANU TEJAA</span></p>
        </section>
      )}

      {phase === "wish" && (
        <div className="slide-up">
          <WishScreen onWish={() => setPhase("experience")} />
        </div>
      )}

      {phase === "experience" && (
        <section className="experience slide-up">
          <header className="topline">
            <span>MADE WITH A LITTLE EXTRA HEART</span>
            <span className="counter-badge">✦ {String(index + 1).padStart(2, "0")} / {wishes.length} ✦</span>
          </header>

          <div className="portrait-wrap">
            <div className="orbit orbit-a" />
            <div className="orbit orbit-b" />
            <div className="orbit orbit-c" />
            <div className="portrait-frame">
              <img src="./sadaa-dot-art.png" alt="Portrait of Sadaa" className="portrait" />
              <div className="portrait-shine" />
            </div>
            <span className="spark spark-a">✧</span>
            <span className="spark spark-b">✦</span>
            <span className="spark spark-c">✧</span>
            <span className="spark spark-d">✦</span>
          </div>

          <p className="eyebrow">TODAY, THE WORLD CELEBRATES YOU</p>
          <h1 className="birthday-title">
            Happy Birthday,<br />
            <span className="name-glow">Sadaa.</span>
          </h1>

          <div className="wish-card" key={wish.language}>
            <div className="wish-card-border" />
            <div className="language">
              {wish.language} <span>✦</span>
            </div>
            <h2 className="wish-greeting">{wish.greeting}</h2>
            <p className="wish-message">{wish.message}</p>
          </div>

          <div className="actions">
            <button className="primary glow-btn" onClick={nextWish}>
              Another language <span className="btn-arrow">→</span>
            </button>
            <button className="secondary" onClick={() => setShowNote((v) => !v)}>
              {showNote ? "Close note" : "💌 One little note"}
            </button>
            <button className="secondary sky-btn" onClick={() => setPhase("memories")}>
              ✦ Our little sky
            </button>
          </div>

          {showNote && (
            <div className="personal-note slide-up">
              <span className="note-star">✦</span>
              <p>
                Some people make ordinary days feel like stories worth remembering.
                I'm glad our paths crossed, Sadaa. I hope this year gives you reasons
                to feel proud, peaceful, loved, and excited for what comes next.
              </p>
              <small>— from your bestie, BHANU TEJAA ♡</small>
            </div>
          )}

          <p className="counter">
            WISH {index + 1} OF {wishes.length} <span>•</span> MADE FOR SADAA
          </p>

          {hearts && (
            <div className="floating-hearts" aria-hidden="true">
              ✦ ♡ ✧ ♡ ✦ ♡ ✧ ♡ ✦
            </div>
          )}
        </section>
      )}

      {phase === "memories" && <MemoriesView onBack={() => setPhase("experience")} />}

      <footer>
        FOR SADAA, WITH GOOD VIBES ONLY <span>♡</span> · A SURPRISE BY BHANU TEJAA
      </footer>
    </main>
  );
}
