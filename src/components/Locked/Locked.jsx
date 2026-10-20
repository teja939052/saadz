import { useEffect, useState } from "react";
import { UNLOCK_AT, UNLOCK_TITLE, UNLOCK_SUB, timeLeft, unlockLabel } from "../../data/unlock.js";
import StarField from "../StarField.jsx";
import "./Locked.css";

const UNITS = [
  { key: "days", label: "days" },
  { key: "hours", label: "hours" },
  { key: "minutes", label: "minutes" },
  { key: "seconds", label: "seconds" },
];

export default function Locked({ onUnlocked }) {
  const [left, setLeft] = useState(() => timeLeft(UNLOCK_AT));

  useEffect(() => {
    const tick = () => {
      const next = timeLeft(UNLOCK_AT);
      setLeft(next);
      if (!next) {
        try {
          window.localStorage.setItem("sadaa-unlocked", "1");
        } catch {
          /* storage may be blocked */
        }
        onUnlocked();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [onUnlocked]);

  return (
    <main className="locked">
      <StarField nameAlpha={0.75} />

      <section className="lock-panel">
        <div className="lock-seal">
          <div className="lock-seal-inner">
            <span>✦</span>
          </div>
          <div className="lock-pulse" />
        </div>

        <p className="eyebrow">SEALED UNTIL MIDNIGHT</p>
        <div className="title-card">
          <h1 className="lock-title">
            <span className="lock-notyet">Not yet,</span>
            <span className="dune lock-name">Sadaa</span>
            <span className="ornament">✦</span>
          </h1>
        </div>
        <p className="lock-sub">{UNLOCK_SUB}</p>

        <div className="countdown" role="timer" aria-live="polite">
          {UNITS.map((u) => (
            <div className="cd-cell" key={u.key}>
              <span className="cd-num">
                {left ? String(left[u.key]).padStart(2, "0") : "00"}
              </span>
              <span className="cd-label">{u.label}</span>
            </div>
          ))}
        </div>

        <p className="lock-when">{unlockLabel(UNLOCK_AT)}</p>
        {left && (
          <p className="lock-total">
            about {Math.floor(left.total / 3600000)} hours and {left.minutes} minutes to go
          </p>
        )}
        <p className="tiny lock-hint">one more sleep, and then it is all yours ♡</p>

        {import.meta.env.DEV && (
          <button
            className="dev-unlock"
            onClick={() => {
              try {
                window.localStorage.setItem("sadaa-unlocked", "1");
              } catch {
                /* storage may be blocked */
              }
              onUnlocked();
            }}
          >
            preview it now (dev only)
          </button>
        )}
      </section>

      <footer>
        A SURPRISE BY <span className="dune-sm">Bhanu Teja</span> <span>♡</span>
      </footer>
    </main>
  );
}
