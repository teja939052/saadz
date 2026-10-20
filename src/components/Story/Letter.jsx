import VoiceNote from "./VoiceNote.jsx";

const letterText =
  "Sadaa, if you are reading this, the candles are out, the wish is already made, and somewhere in this little piece of code I am still smiling at you. Eighteen is not a number that describes you — it is only the year the sky gained another star. I hope this year is gentle with you, and loud in the good ways. I hope you keep the people who show up, and become the person who shows up for others. Keep the photographs, the laughter, and the bad days too, because I promise you the bad days are what make the good ones glow. You were always the best part of every room, Sadaa. Happy eighteenth, my person.";

export default function Letter({ voice }) {
  return (
    <div className="letter-stage">
      <div className="scroll-paper">
        <div className="scroll-rod top" />
        <div className="letter-sheet">
          <span className="letter-star">✦</span>
          <p className="letter-date">Today — your eighteenth</p>
          {letterText.split(". ").map((line, i) => (
            <p className="letter-body" key={i}>
              {line.trim()}.
            </p>
          ))}          <div className="letter-sign">
            <span className="letter-sig dune-sm">Bhanu Teja</span>
            <span className="letter-seal">✦</span>
          </div>
          <p className="letter-keep">keep this one forever ♡</p>
        </div>
        <div className="scroll-rod bottom" />
      </div>

      <VoiceNote text={letterText} src={voice} label="hear the letter" />
    </div>
  );
}
