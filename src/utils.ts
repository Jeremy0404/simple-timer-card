/**
 * Parse an HA duration string ("HH:MM:SS", "H:MM:SS", or "MM:SS") to seconds.
 * Returns 0 for falsy / unparseable input.
 */
export function parseDuration(input: string | undefined | null): number {
  if (!input) return 0;
  const parts = input.split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) [h, m, s] = parts as [number, number, number];
  else if (parts.length === 2) [m, s] = parts as [number, number];
  else if (parts.length === 1) [s] = parts as [number];
  return h * 3600 + m * 60 + s;
}

/**
 * Format a non-negative number of seconds as MM:SS, or H:MM:SS if >= 1h.
 * Negative inputs clamp to 0.
 */
export function formatDuration(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Format HH:MM:SS for service calls (timer.start expects this shape). */
export function toServiceDuration(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
