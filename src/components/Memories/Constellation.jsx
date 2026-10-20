import { memories, constellationLinks } from "../../data/memories.js";
import useMouseParallax from "../../hooks/useMouseParallax.js";

export default function Constellation({ onOpen }) {
  const parallaxRef = useMouseParallax(14);

  return (
    <div className="constellation" ref={parallaxRef}>
      <svg
        className="constellation-lines"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {constellationLinks.map(([a, b], i) => (
          <line
            key={`${a}-${b}`}
            x1={memories[a].x}
            y1={memories[a].y}
            x2={memories[b].x}
            y2={memories[b].y}
            pathLength="1"
            style={{ animationDelay: `${0.5 + i * 0.22}s` }}
          />
        ))}
      </svg>

      {memories.map((m, i) => (
        <button
          key={m.id}
          className="memory-star"
          style={{
            "--x": `${m.x}%`,
            "--y": `${m.y}%`,
            "--d": `${0.15 + i * 0.18}s`,
          }}
          onClick={() => onOpen(m)}
          aria-label={`Open memory: ${m.title}`}
        >
          <span className="star-core">
            <span className="star-halo" />
            <span className="star-ring" />
            <img src={m.src} alt="" loading="lazy" style={{ objectPosition: m.focus || "50% 40%" }} />
          </span>
          <span className="star-label">{m.title}</span>
        </button>
      ))}
    </div>
  );
}
