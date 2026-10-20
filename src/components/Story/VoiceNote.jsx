import { useEffect, useRef, useState } from "react";

export default function VoiceNote({ text, src, label = "hear it" }) {
  const [state, setState] = useState("idle");
  const [hasAudio, setHasAudio] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let alive = true;
    if (!src) {
      setHasAudio(false);
      return;
    }
    fetch(src, { method: "HEAD" })
      .then((r) => alive && setHasAudio(r.ok))
      .catch(() => alive && setHasAudio(false));
    return () => {
      alive = false;
    };
  }, [src]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function pickVoice() {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    return (
      voices.find((v) => /female|zira|samantha|aria|jenny|karen|serena|moira/i.test(v.name)) ||
      voices.find((v) => v.lang && v.lang.startsWith("en")) ||
      voices[0]
    );
  }

  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 1.06;
    const v = pickVoice();
    if (v) u.voice = v;
    u.onstart = () => setState("playing");
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    window.speechSynthesis.speak(u);
    setState("playing");
  }

  function play() {
    if (state === "playing") {
      if (audioRef.current) audioRef.current.pause();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setState("idle");
      return;
    }
    if (hasAudio) {
      const a = new Audio(src);
      audioRef.current = a;
      a.onplay = () => setState("playing");
      a.onended = () => setState("idle");
      a.onerror = () => setState("idle");
      a.play().catch(() => {
        setState("idle");
        speak();
      });
    } else {
      speak();
    }
  }

  return (
    <button
      className={`voice-note ${state === "playing" ? "playing" : ""}`}
      onClick={play}
      aria-label={state === "playing" ? "Stop voice note" : label}
    >
      <span className="voice-orb">
        <i />
        <i />
        <i />
      </span>
      <span className="voice-label">
        {state === "playing" ? "playing…" : hasAudio ? label : "hear it read"}
      </span>
    </button>
  );
}
