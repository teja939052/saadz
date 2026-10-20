import { useEffect } from "react";
import Polaroid from "./Polaroid.jsx";

export default function MemoryModal({ memory, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={memory.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close memory">
          ×
        </button>
        <span className="modal-sparkle sparkle-1">✦</span>
        <span className="modal-sparkle sparkle-2">✧</span>
        <span className="modal-sparkle sparkle-3">✦</span>
        <Polaroid src={memory.src} caption={memory.title} angle={memory.angle} focus={memory.focus} />
        <p className="modal-caption">{memory.caption}</p>
        <span className="modal-by">remembered &amp; made by BHANU TEJAA</span>
      </div>
    </div>
  );
}
