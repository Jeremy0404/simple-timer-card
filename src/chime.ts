type AudioContextCtor = typeof AudioContext;

const PEAK_GAIN = 0.25;
const BEEP_LENGTH_S = 0.2;
const SECOND_BEEP_OFFSET_S = 0.25;
const BEEP_FREQUENCY_HZ = 880;

function audioContextCtor(): AudioContextCtor | undefined {
  const g = globalThis as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return g.AudioContext ?? g.webkitAudioContext;
}

export class Chime {
  private _ctx?: AudioContext;

  play(): void {
    const ctx = this._context();
    if (!ctx) return;
    this._resumeIfAutoplayBlocked(ctx);
    this._beep(ctx, 0);
    this._beep(ctx, SECOND_BEEP_OFFSET_S);
  }

  private _resumeIfAutoplayBlocked(ctx: AudioContext): void {
    if (ctx.state === 'suspended') void ctx.resume();
  }

  dispose(): void {
    void this._ctx?.close();
    this._ctx = undefined;
  }

  private _context(): AudioContext | undefined {
    const Ctor = audioContextCtor();
    if (!Ctor) return undefined;
    return (this._ctx ??= new Ctor());
  }

  private _beep(ctx: AudioContext, startOffset: number): void {
    const start = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = BEEP_FREQUENCY_HZ;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + BEEP_LENGTH_S);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + BEEP_LENGTH_S + 0.02);
  }
}
