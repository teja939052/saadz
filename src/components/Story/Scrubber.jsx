import { useRef, useState } from "react";

export default function Scrubber({ chapters, active, onScrub, onJump }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const frames = chapters.filter((c) => c.src);

  function valueFromEvent(e) {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const x = (e.clientX ?? 0) - rect.left;
    return Math.min(1, Math.max(0, x / rect.width));
  }

  function onPointerDown(e) {
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onScrub(valueFromEvent(e));
  }

  function onPointerMove(e) {
    if (!dragging) return;
    onScrub(valueFromEvent(e));
  }

  function onPointerUp(e) {
    if (!dragging) return;
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    onScrub(null);
  }

  return (
    <div className={`scrubber ${dragging ? "dragging" : ""}`}>
      <div
        className="scrub-track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label="Scrub the current chapter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((active / Math.max(1, frames.length)) * 100)}
        tabIndex={0}
      >
        <div className="scrub-fill" style={{ width: `${(active / Math.max(1, frames.length)) * 100}%` }} />
        {frames.map((c, i) => (
          <button
            key={c.id}
            className={`scrub-frame ${active === i + 1 ? "active" : ""}`}
            style={{ left: `${((i + 0.5) / frames.length) * 100}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onJump(i + 1);
            }}
            title={c.title}
            aria-label={`Go to ${c.title}`}
          >
            <img src={c.src} alt="" loading="lazy" />
            <span>{String(i + 1).padStart(2, "0")}</span>
          </button>
        ))}
        <div
          className="scrub-head"
          style={{ left: `${(active / Math.max(1, frames.length)) * 100}%` }}
        />
      </div>
      <p className="scrub-hint">drag the reel to scrub the chapter</p>
    </div>
  );
}
