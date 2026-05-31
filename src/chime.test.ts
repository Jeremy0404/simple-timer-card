import { afterEach, describe, expect, test, vi } from 'vitest';
import { Chime } from './chime.js';

interface FakeOscillator {
  type: string;
  frequency: { value: number };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

function fakeContext(state: 'running' | 'suspended') {
  const oscillators: FakeOscillator[] = [];
  const ctx = {
    state,
    currentTime: 0,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    createOscillator: vi.fn((): FakeOscillator => {
      const osc: FakeOscillator = {
        type: '',
        frequency: { value: 0 },
        connect: vi.fn().mockReturnThis(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(osc);
      return osc;
    }),
    createGain: vi.fn(() => ({
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
    })),
  };
  return { ctx, oscillators };
}

function installSharedAudioContext(ctx: unknown) {
  const ctor = vi.fn(function (this: unknown) {
    return ctx;
  });
  (globalThis as { AudioContext?: unknown }).AudioContext = ctor;
  return ctor;
}

afterEach(() => {
  delete (globalThis as { AudioContext?: unknown }).AudioContext;
  vi.restoreAllMocks();
});

describe('Chime', () => {
  test('is a silent no-op when WebAudio is unavailable', () => {
    expect(() => new Chime().play()).not.toThrow();
  });

  test('emits a double-beep on play', () => {
    const { ctx, oscillators } = fakeContext('running');
    installSharedAudioContext(ctx);

    new Chime().play();

    expect(oscillators).toHaveLength(2);
    for (const osc of oscillators) {
      expect(osc.start).toHaveBeenCalledOnce();
      expect(osc.stop).toHaveBeenCalledOnce();
    }
  });

  test('resumes a context the autoplay policy left suspended', () => {
    const { ctx } = fakeContext('suspended');
    installSharedAudioContext(ctx);

    new Chime().play();

    expect(ctx.resume).toHaveBeenCalledOnce();
  });

  test('reuses one context across plays and closes it on dispose', () => {
    const { ctx } = fakeContext('running');
    const ctor = installSharedAudioContext(ctx);

    const chime = new Chime();
    chime.play();
    chime.play();
    expect(ctor).toHaveBeenCalledOnce();

    chime.dispose();
    expect(ctx.close).toHaveBeenCalledOnce();
  });
});
