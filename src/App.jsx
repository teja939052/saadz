import { useState } from "react";
import "./App.css";

const wishes = [
  { language: "English", greeting: "Happy Birthday, Sadaa!", message: "May this new chapter bring you beautiful surprises, brave dreams, and a hundred little reasons to smile." },
  { language: "తెలుగు", greeting: "పుట్టినరోజు శుభాకాంక్షలు, సదా!", message: "నీ జీవితం ఆనందం, ప్రేమ, విజయాలతో నిండిపోవాలి. నీ కలలన్నీ ఒక్కొక్కటిగా నిజం కావాలి!" },
  { language: "हिन्दी", greeting: "जन्मदिन मुबारक हो, सदा!", message: "तुम्हारी ज़िंदगी खुशियों, प्यार और खूबसूरत यादों से भरी रहे। तुम्हारे सारे सपने पूरे हों!" },
  { language: "தமிழ்", greeting: "இனிய பிறந்தநாள் வாழ்த்துகள், சதா!", message: "உன் வாழ்க்கை மகிழ்ச்சி, அன்பு, வெற்றி நிறைந்ததாக இருக்கட்டும். உன் கனவுகள் எல்லாம் நனவாகட்டும்!" },
  { language: "ಕನ್ನಡ", greeting: "ಹುಟ್ಟುಹಬ್ಬದ ಶುಭಾಶಯಗಳು, ಸದಾ!", message: "ನಿನ್ನ ಜೀವನ ಸಂತೋಷ, ಪ್ರೀತಿ ಮತ್ತು ಯಶಸ್ಸಿನಿಂದ ತುಂಬಿರಲಿ. ನಿನ್ನ ಕನಸುಗಳೆಲ್ಲ ನನಸಾಗಲಿ!" },
  { language: "മലയാളം", greeting: "ജന്മദിനാശംസകൾ, സദാ!", message: "നിന്റെ ജീവിതം സന്തോഷവും സ്നേഹവും മനോഹരമായ ഓർമ്മകളും കൊണ്ട് നിറയട്ടെ!" },
  { language: "Français", greeting: "Joyeux anniversaire, Sadaa !", message: "Que cette nouvelle année t’apporte du bonheur, de belles surprises et des rêves qui deviennent réalité." },
  { language: "Español", greeting: "¡Feliz cumpleaños, Sadaa!", message: "Que tu vida esté llena de alegría, cariño, aventuras bonitas y sueños cumplidos." },
  { language: "日本語", greeting: "お誕生日おめでとう、サダー！", message: "笑顔と幸せがたくさんあふれる、素敵な一年になりますように。" },
  { language: "한국어", greeting: "생일 축하해요, Sadaa!", message: "행복과 사랑, 아름다운 추억으로 가득한 한 해가 되길 바라요." },
];

export default function App() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [showNote, setShowNote] = useState(false);
  const [hearts, setHearts] = useState(false);
  const wish = wishes[index];

  function nextWish() {
    setIndex((current) => (current + 1) % wishes.length);
    setHearts(true);
    window.setTimeout(() => setHearts(false), 1200);
  }

  return (
    <main className="page">
      <div className="grain" />
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      {!started ? (
        <section className="intro panel">
          <p className="eyebrow">A LITTLE SOMETHING MADE JUST FOR YOU</p>
          <div className="seal">✦</div>
          <h1>For <span>Sadaa</span></h1>
          <p className="subtitle">Some wishes deserve more than a message.</p>
          <button className="primary" onClick={() => setStarted(true)}>Open your little surprise <span>↗</span></button>
          <p className="tiny">best viewed with the sound on ✨</p>
        </section>
      ) : (
        <section className="experience">
          <header className="topline"><span>MADE WITH A LITTLE EXTRA HEART</span><span>✦ 01 / 10 ✦</span></header>
          <div className="portrait-wrap">
            <div className="orbit orbit-a" />
            <div className="orbit orbit-b" />
            <img src="./sadaa-dot-art.png" alt="Pointillist birthday portrait created for Sadaa" className="portrait" />
            <span className="spark spark-a">✧</span><span className="spark spark-b">✦</span><span className="spark spark-c">✧</span>
          </div>
          <p className="eyebrow">TODAY, THE WORLD CELEBRATES YOU</p>
          <h1 className="birthday-title">Happy Birthday,<br/><span>Sadaa.</span></h1>
          <div className="wish-card" key={wish.language}>
            <div className="language">{wish.language} <span>✦</span></div>
            <h2>{wish.greeting}</h2>
            <p>{wish.message}</p>
          </div>
          <div className="actions">
            <button className="primary" onClick={nextWish}>Another language <span>→</span></button>
            <button className="secondary" onClick={() => setShowNote((v) => !v)}>{showNote ? "Close note" : "One little note"}</button>
          </div>
          {showNote && <div className="personal-note"><span className="note-star">✦</span><p>Some people make ordinary days feel like stories worth remembering. I’m glad our paths crossed, Sadaa. I hope this year gives you reasons to feel proud, peaceful, loved, and excited for what comes next.</p><small>— from your bestie ♡</small></div>}
          <p className="counter">WISH {index + 1} OF {wishes.length} <span>•</span> MADE FOR SADAA</p>
          {hearts && <div className="floating-hearts" aria-hidden="true">✦　♡　✧　♡　✦</div>}
        </section>
      )}
      <footer>FOR SADAA, WITH GOOD VIBES ONLY <span>♡</span></footer>
    </main>
  );
}
