/** Parse an HA duration string ("HH:MM:SS", "H:MM:SS" or "MM:SS") to seconds; 0 if unparseable. */
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

/** Format seconds as MM:SS, or H:MM:SS once >= 1 hour. Negatives clamp to 0. */
export function formatDuration(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const { h, m, s } = splitHMS(t);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Format seconds as HH:MM:SS — the shape timer.start expects. */
export function toServiceDuration(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const { h, m, s } = splitHMS(t);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Format a signed seconds delta as ±HH:MM:SS — the shape timer.change expects. */
export function toAdjustDuration(deltaSeconds: number): string {
  const sign = deltaSeconds < 0 ? '-' : '';
  return `${sign}${toServiceDuration(Math.abs(deltaSeconds))}`;
}

/** Split a non-negative seconds count into hours/minutes/seconds. */
export function splitHMS(totalSeconds: number): { h: number; m: number; s: number } {
  const t = Math.max(0, Math.floor(totalSeconds));
  return {
    h: Math.floor(t / 3600),
    m: Math.floor((t % 3600) / 60),
    s: t % 60,
  };
}
