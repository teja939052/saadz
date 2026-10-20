import { useState, useEffect, useRef } from "react";
import "./App.css";
import StoryView from "./components/Story/StoryView.jsx";
import Particles from "./components/Particles.jsx";
import Locked from "./components/Locked/Locked.jsx";
import { UNLOCK_AT, isUnlocked } from "./data/unlock.js";

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
  const [phase, setPhase] = useState("intro"); // intro | wish | experience | story
  const [index, setIndex] = useState(0);
  const [showNote, setShowNote] = useState(false);
  const [hearts, setHearts] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [unlocked, setUnlocked] = useState(() => isUnlocked(UNLOCK_AT));
  const wish = wishes[index];

  function nextWish() {
    setIndex((c) => (c + 1) % wishes.length);
    setHearts(true);
    setConfetti((c) => c + 1);
    setTimeout(() => setHearts(false), 1200);
  }

  if (!unlocked) return <Locked onUnlocked={() => setUnlocked(true)} />;

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
          <div className="title-card">
            <h1 className="intro-title">
              For <span className="dune intro-name">Sadaa</span>
            </h1>
            <span className="ornament">✦</span>
          </div>
          <p className="subtitle">Some wishes deserve more than a message.</p>
          <button className="primary glow-btn" onClick={() => setPhase("wish")}>
            Open your surprise <span className="btn-arrow">↗</span>
          </button>
          <p className="tiny">best experienced with sound on ✨</p>
          <p className="credit">
            handmade for you — by <span className="dune-sm">Bhanu Teja</span>
          </p>
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
          <div className="eighteen-badge">
            <span className="badge-star">✦</span>
            <span>TURNING EIGHTEEN TONIGHT</span>
            <span className="badge-star">✦</span>
          </div>
          <h1 className="birthday-title">
            Happy 18th Birthday,
            <br />
            <span className="dune name-glow">Sadaa</span>          </h1>

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
            <button className="secondary sky-btn" onClick={() => setPhase("story")}>
              ✦ Our story
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

      {phase === "story" && <StoryView onBack={() => setPhase("experience")} />}

      <footer>
        FOR <span className="dune-sm">Sadaa</span>, WITH GOOD VIBES ONLY <span>♡</span> · A SURPRISE BY{" "}
        <span className="dune-sm">Bhanu Teja</span>
      </footer>
    </main>
  );
}
