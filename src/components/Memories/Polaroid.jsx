export default function Polaroid({ src, caption, angle = -4, focus = "50% 40%" }) {
  return (
    <figure className="polaroid" style={{ "--tilt": `${angle}deg` }}>
      <div className="polaroid-photo">
        <img src={src} alt={caption} loading="lazy" style={{ objectPosition: focus }} />
      </div>
      <figcaption className="polaroid-caption">{caption}</figcaption>
    </figure>
  );
}
