// Lightweight client-side anti-cheat: rate-limits actions and detects suspicious bursts.
// Server-side constraints (daily mission count, unique check-in/day) provide the real ceiling.

const KEY = 'questup_action_log';
const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 8; // max completions per minute
const MIN_GAP_MS = 1500; // minimum gap between completions

type Action = { t: number; type: string };

const read = (): Action[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

const write = (a: Action[]) => localStorage.setItem(KEY, JSON.stringify(a));

export type AntiCheatResult = { ok: true } | { ok: false; reason: string };

export const checkAction = (type: string): AntiCheatResult => {
  const now = Date.now();
  const log = read().filter(a => now - a.t < WINDOW_MS);

  if (log.length > 0 && now - log[log.length - 1].t < MIN_GAP_MS) {
    return { ok: false, reason: 'Slow down — please wait a moment between actions.' };
  }
  if (log.length >= MAX_PER_WINDOW) {
    return { ok: false, reason: 'Suspicious activity detected. Please wait a minute before completing more missions.' };
  }
  return { ok: true };
};

export const recordAction = (type: string) => {
  const now = Date.now();
  const log = read().filter(a => now - a.t < WINDOW_MS);
  log.push({ t: now, type });
  write(log);
};
