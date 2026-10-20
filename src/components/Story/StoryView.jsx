import { useEffect, useRef, useState } from "react";
import { story } from "../../data/story.js";
import Reveal from "./Reveal.jsx";
import "./Story.css";

export default function StoryView({ onBack }) {
  const [active, setActive] = useState(0);
  const sectionRefs = useRef([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
            setActive(Number(entry.target.dataset.index));
          }
        });
      },
      { threshold: [0.45, 0.7] }
    );
    sectionRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const match = window.location.hash.match(/^#ch-(\d+)$/);
    if (!match) return;
    const idx = Number(match[1]);
    const target = sectionRefs.current[idx + 1];
    if (target) setTimeout(() => target.scrollIntoView({ behavior: "auto", block: "start" }), 260);
  }, []);

  const sections = story.length + 1;

  function goTo(i) {
    const idx = Math.max(0, Math.min(sections - 1, i));
    const el = sectionRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goTo(active + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goTo(active - 1);
      } else if (e.key === "Escape") {
        onBack();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onBack]);

  return (
    <div className="story">
      <div className="story-top">
        <button className="story-back" onClick={onBack}>
          ← back to the wish
        </button>
        <div className="story-progress">
          <span style={{ width: `${((active + 1) / sections) * 100}%` }} />
        </div>
      </div>

      <nav className="story-rail" aria-label="Story chapters">
        {story.map((c, i) => (
          <button
            key={c.id}
            className={`rail-dot ${active === i + 1 ? "active" : ""} ${active > i + 1 ? "passed" : ""}`}
            onClick={() => goTo(i + 1)}
            aria-label={c.title}
            title={c.title}
          >
            <span className="rail-num">{String(i + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </nav>

      <div className="story-scroll">
        <section
          className="story-chapter story-intro"
          data-index="0"
          ref={(el) => (sectionRefs.current[0] = el)}
        >
          <p className="eyebrow">A STORY IN SIX FRAMES</p>
          <h2 className="story-intro-title">
            for the girl who<br />
            <span>turns eighteen</span>
            <br />
            tonight
          </h2>
          <p className="story-intro-sub">
            Every photo below is rendered differently — because you have never been one
            single kind of wonderful.
          </p>
          <div className="scroll-hint">
            <span>scroll</span>
            <i />
          </div>
        </section>

        {story.map((chapter, i) => (
          <section
            key={chapter.id}
            className="story-chapter"
            data-index={i + 1}
            ref={(el) => (sectionRefs.current[i + 1] = el)}
          >
            <div
              className="chapter-frame"
              style={{
                "--frame-aspect": chapter.aspect || "4 / 5",
                "--frame-width": chapter.aspect === "4 / 5" ? "min(74vw, 330px)" : "min(88vw, 520px)",
              }}
            >
              <span className="chapter-number">{String(i + 1).padStart(2, "0")}</span>
              <Reveal chapter={chapter} active={active === i + 1} />
              <span className="chapter-glow" style={{ "--accent": chapter.accent }} />
            </div>
            <div className="chapter-copy">
              <p className="eyebrow">{chapter.kicker}</p>
              <h3 className="chapter-title">{chapter.title}</h3>
              <p className="chapter-caption">{chapter.caption}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
