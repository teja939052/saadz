/* The surprise opens at midnight, 22 October 2026. */
export const UNLOCK_AT = "2026-10-22T00:00:00";

export const UNLOCK_TITLE = "Not yet, Sadaa.";
export const UNLOCK_SUB =
  "This one waits for midnight. The 22nd of October — the moment the day turns over and you become officially eighteen.";

export function unlockLabel(target) {
  const d = new Date(target);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} · ${pad(d.getMonth() + 1)} · ${d.getFullYear()} — ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function timeLeft(target) {
  const now = Date.now();
  const end = new Date(target).getTime();
  const diff = end - now;
  if (diff <= 0) return null;
  return {
    total: diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function isUnlocked(target) {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  // ?open=1 is a dev-machine test bypass only — the deployed link stays sealed
  if (params.get("open") === "1" && import.meta.env.DEV) return true;
  try {
    if (window.localStorage.getItem("sadaa-unlocked") === "1") return true;
  } catch {
    /* storage may be blocked */
  }
  return new Date(target).getTime() <= Date.now();
}
