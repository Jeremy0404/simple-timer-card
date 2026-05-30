const PRIMARY_BUTTON = 0;

export interface TapControllerOptions {
  holdMs: number;
  doubleTapMs: number;
  hasHold: () => boolean;
  hasDoubleTap: () => boolean;
  onTap: () => void;
  onHold: () => void;
  onDoubleTap: () => void;
}

export class TapController {
  private _holdTimer?: number;
  private _holdFired = false;
  private _pointerDown = false;
  private _swallowClick = false;
  private _pendingTapTimer?: number;
  private _lastTapMs = 0;

  constructor(private readonly options: TapControllerOptions) {}

  handlePointerDown(event: PointerEvent): void {
    if (event.button !== PRIMARY_BUTTON) return;
    this._pointerDown = true;
    this._holdFired = false;
    this._swallowClick = false;
    if (!this.options.hasHold()) return;
    this._clearHoldTimer();
    this._holdTimer = window.setTimeout(() => {
      this._holdTimer = undefined;
      this._holdFired = true;
      this.options.onHold();
    }, this.options.holdMs);
  }

  handlePointerUp(): void {
    this._clearHoldTimer();
    if (!this._pointerDown) return;
    this._pointerDown = false;
    this._swallowClick = true;
    if (this._holdFired) {
      this._holdFired = false;
      return;
    }
    this._resolveTap();
  }

  handlePointerCancel(): void {
    this._clearHoldTimer();
    if (this._pointerDown) this._swallowClick = true;
    this._pointerDown = false;
    this._holdFired = false;
  }

  // A keyboard click (Enter/Space) has no preceding pointer sequence, so it taps; a pointer's echo click is swallowed.
  handleClick(): void {
    if (this._swallowClick) {
      this._swallowClick = false;
      return;
    }
    this.options.onTap();
  }

  dispose(): void {
    this._clearHoldTimer();
    this._clearPendingTapTimer();
  }

  private _resolveTap(): void {
    if (!this.options.hasDoubleTap()) {
      this.options.onTap();
      return;
    }
    const now = Date.now();
    const withinDoubleTapWindow =
      this._pendingTapTimer !== undefined && now - this._lastTapMs < this.options.doubleTapMs;
    if (withinDoubleTapWindow) {
      this._clearPendingTapTimer();
      this._lastTapMs = 0;
      this.options.onDoubleTap();
      return;
    }
    this._lastTapMs = now;
    this._pendingTapTimer = window.setTimeout(() => {
      this._pendingTapTimer = undefined;
      this.options.onTap();
    }, this.options.doubleTapMs);
  }

  private _clearHoldTimer(): void {
    if (this._holdTimer !== undefined) {
      window.clearTimeout(this._holdTimer);
      this._holdTimer = undefined;
    }
  }

  private _clearPendingTapTimer(): void {
    if (this._pendingTapTimer !== undefined) {
      window.clearTimeout(this._pendingTapTimer);
      this._pendingTapTimer = undefined;
    }
  }
}
