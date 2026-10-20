import { useState } from "react";
import Constellation from "./Constellation.jsx";
import MemoryModal from "./MemoryModal.jsx";
import "./Memories.css";

export default function MemoriesView({ onBack }) {
  const [active, setActive] = useState(null);

  return (
    <section className="memories slide-up">
      <header className="topline">
        <span>A CONSTELLATION OF MOMENTS</span>
        <span className="counter-badge">✦ OUR LITTLE SKY ✦</span>
      </header>

      <p className="eyebrow">EVERY STAR IS A MOMENT I KEPT</p>
      <h2 className="memories-title">
        Our little <span>sky</span>
      </h2>
      <p className="memories-sub">tap a star, Sadaa — each one is hiding something of yours</p>

      <Constellation onOpen={setActive} />

      <div className="memories-actions">
        <button className="secondary" onClick={onBack}>
          ← Back to your wishes
        </button>
      </div>

      <p className="credit-line">
        collected with love, coded by <span>BHANU TEJAA</span>
      </p>

      {active && <MemoryModal memory={active} onClose={() => setActive(null)} />}
    </section>
  );
}
