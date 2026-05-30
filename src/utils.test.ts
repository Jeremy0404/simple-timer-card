import { describe, expect, test } from 'vitest';
import {
  dayOffset,
  formatDuration,
  parseDuration,
  splitHMS,
  toAdjustDuration,
  toServiceDuration,
} from './utils.js';

describe('parseDuration', () => {
  test('parses HH:MM:SS', () => {
    expect(parseDuration('01:02:03')).toBe(3723);
    expect(parseDuration('00:00:30')).toBe(30);
    expect(parseDuration('99:59:59')).toBe(99 * 3600 + 59 * 60 + 59);
  });

  test('parses H:MM:SS', () => {
    expect(parseDuration('1:02:03')).toBe(3723);
  });

  test('parses MM:SS', () => {
    expect(parseDuration('05:30')).toBe(330);
    expect(parseDuration('00:00')).toBe(0);
  });

  test('parses single number as seconds', () => {
    expect(parseDuration('45')).toBe(45);
  });

  test('returns 0 for empty / nullish', () => {
    expect(parseDuration(undefined)).toBe(0);
    expect(parseDuration(null)).toBe(0);
    expect(parseDuration('')).toBe(0);
  });

  test('returns 0 for unparseable input', () => {
    expect(parseDuration('abc')).toBe(0);
    expect(parseDuration('not:a:duration')).toBe(0);
    expect(parseDuration('1:foo:3')).toBe(0);
  });
});

describe('formatDuration', () => {
  test('formats < 1 hour as MM:SS', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(5)).toBe('00:05');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3599)).toBe('59:59');
  });

  test('formats >= 1 hour as H:MM:SS', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3723)).toBe('1:02:03');
    expect(formatDuration(36000)).toBe('10:00:00');
  });

  test('clamps negatives to 0', () => {
    expect(formatDuration(-1)).toBe('00:00');
    expect(formatDuration(-1000)).toBe('00:00');
  });

  test('floors fractional seconds', () => {
    expect(formatDuration(5.9)).toBe('00:05');
    expect(formatDuration(60.4)).toBe('01:00');
  });
});

describe('toServiceDuration', () => {
  test('always uses HH:MM:SS shape', () => {
    expect(toServiceDuration(0)).toBe('00:00:00');
    expect(toServiceDuration(5)).toBe('00:00:05');
    expect(toServiceDuration(65)).toBe('00:01:05');
    expect(toServiceDuration(3723)).toBe('01:02:03');
  });

  test('clamps negatives to 0', () => {
    expect(toServiceDuration(-10)).toBe('00:00:00');
  });

  test('round-trips with parseDuration', () => {
    for (const s of [0, 30, 90, 3600, 3723, 86399]) {
      expect(parseDuration(toServiceDuration(s))).toBe(s);
    }
  });
});

describe('toAdjustDuration', () => {
  test('formats positive deltas without a sign', () => {
    expect(toAdjustDuration(0)).toBe('00:00:00');
    expect(toAdjustDuration(30)).toBe('00:00:30');
    expect(toAdjustDuration(60)).toBe('00:01:00');
    expect(toAdjustDuration(3661)).toBe('01:01:01');
  });

  test('prefixes negative deltas with a minus', () => {
    expect(toAdjustDuration(-30)).toBe('-00:00:30');
    expect(toAdjustDuration(-60)).toBe('-00:01:00');
    expect(toAdjustDuration(-3661)).toBe('-01:01:01');
  });

  test('floors fractional deltas', () => {
    expect(toAdjustDuration(30.9)).toBe('00:00:30');
    expect(toAdjustDuration(-30.9)).toBe('-00:00:30');
  });
});

describe('dayOffset', () => {
  const at = (y: number, mo: number, d: number, h: number, mi: number) =>
    new Date(y, mo, d, h, mi).getTime();

  test('is 0 within the same calendar day', () => {
    expect(dayOffset(at(2026, 0, 1, 0, 0), at(2026, 0, 1, 23, 59))).toBe(0);
  });

  test('is 1 when the finish lands on the next day', () => {
    expect(dayOffset(at(2026, 0, 1, 23, 30), at(2026, 0, 2, 0, 30))).toBe(1);
  });

  test('counts multiple days, including across a month boundary', () => {
    expect(dayOffset(at(2026, 0, 31, 12, 0), at(2026, 1, 2, 12, 0))).toBe(2);
  });

  test('is negative when the target precedes the source', () => {
    expect(dayOffset(at(2026, 0, 2, 0, 30), at(2026, 0, 1, 23, 30))).toBe(-1);
  });
});

describe('splitHMS', () => {
  test('splits common values', () => {
    expect(splitHMS(0)).toEqual({ h: 0, m: 0, s: 0 });
    expect(splitHMS(30)).toEqual({ h: 0, m: 0, s: 30 });
    expect(splitHMS(90)).toEqual({ h: 0, m: 1, s: 30 });
    expect(splitHMS(3723)).toEqual({ h: 1, m: 2, s: 3 });
  });

  test('clamps negatives to 0', () => {
    expect(splitHMS(-10)).toEqual({ h: 0, m: 0, s: 0 });
  });

  test('floors fractional input', () => {
    expect(splitHMS(60.9)).toEqual({ h: 0, m: 1, s: 0 });
  });
});
