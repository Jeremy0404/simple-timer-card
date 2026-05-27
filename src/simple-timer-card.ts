import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { HomeAssistant, SimpleTimerCardConfig, TimerEntity } from './types.js';
import { formatDuration, parseDuration, splitHMS, toServiceDuration } from './utils.js';
import './simple-timer-card-editor.js';

const VERSION = '0.1.0';
const TICK_INTERVAL_MS = 250;
const WARN_THRESHOLD_SECONDS = 10;
const DEFAULT_ICON = 'mdi:timer-outline';

const STATE_LABELS: Record<TimerEntity['state'], string> = {
  idle: 'Idle',
  active: 'Running',
  paused: 'Paused',
};

@customElement('simple-timer-card')
export class SimpleTimerCard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private _config?: SimpleTimerCardConfig;
  /** User-dialed duration; persists until Cancel or setConfig. */
  @state() private _inputSeconds?: number;
  /** Duration being edited in the modal. */
  @state() private _modalSeconds = 0;

  @query('dialog') private _dialog?: HTMLDialogElement;

  private _tickHandle: number | undefined;
  /** Total ms remaining at baseline (when we saw the timer go active). */
  private _activeBaselineMs?: number;
  /** Browser clock at the baseline moment — drives the skew-free stopwatch. */
  private _baselineLocalMs?: number;
  private _lastSeenState?: string;

  public setConfig(config: SimpleTimerCardConfig): void {
    if (!config?.entity || !config.entity.startsWith('timer.')) {
      throw new Error('simple-timer-card: "entity" must be set to a timer.* entity');
    }
    this._config = config;
    this._inputSeconds = undefined;
  }

  public getCardSize(): number {
    return this._config?.compact ? 1 : 2;
  }

  public static getStubConfig(
    _hass: HomeAssistant,
    entities: string[],
  ): Partial<SimpleTimerCardConfig> {
    const timer = entities.find((e) => e.startsWith('timer.'));
    return { entity: timer ?? 'timer.example' };
  }

  public static getConfigElement(): HTMLElement {
    return document.createElement('simple-timer-card-editor');
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this._tickHandle === undefined) {
      this._tickHandle = window.setInterval(() => this.requestUpdate(), TICK_INTERVAL_MS);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._tickHandle !== undefined) {
      window.clearInterval(this._tickHandle);
      this._tickHandle = undefined;
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (!changed.has('hass') && !changed.has('_config')) return;
    const entity = this._entity;
    if (!entity) {
      this._lastSeenState = undefined;
      this._activeBaselineMs = undefined;
      this._baselineLocalMs = undefined;
      return;
    }
    const newState = entity.state;
    if (newState === 'active' && entity.attributes.finishes_at) {
      if (this._lastSeenState !== 'active') {
        const finishMs = Date.parse(entity.attributes.finishes_at);
        const changedMs = Date.parse(entity.last_changed);
        let totalMs: number;
        if (this._lastSeenState === undefined) {
          // Initial mount with the timer already active — no observed transition,
          // so fall back to the clock-skewed estimate. HA doesn't emit periodic
          // updates while active, so this skew can't be resynced before pause/finish.
          totalMs = Math.max(0, finishMs - Date.now());
        } else {
          // Observed transition: total computed in HA's clock (skew-free).
          totalMs = Math.max(0, finishMs - changedMs);
        }
        this._activeBaselineMs = totalMs;
        this._baselineLocalMs = Date.now();
      }
    } else {
      this._activeBaselineMs = undefined;
      this._baselineLocalMs = undefined;
    }
    this._lastSeenState = newState;
  }

  private get _entity(): TimerEntity | undefined {
    if (!this._config || !this.hass) return undefined;
    return this.hass.states[this._config.entity] as unknown as TimerEntity | undefined;
  }

  private _remainingSeconds(entity: TimerEntity): number {
    if (entity.state === 'active') {
      if (this._activeBaselineMs !== undefined && this._baselineLocalMs !== undefined) {
        const elapsed = Date.now() - this._baselineLocalMs;
        return Math.max(0, (this._activeBaselineMs - elapsed) / 1000);
      }
      if (entity.attributes.finishes_at) {
        const endMs = Date.parse(entity.attributes.finishes_at);
        if (!Number.isNaN(endMs)) return Math.max(0, (endMs - Date.now()) / 1000);
      }
    }
    return parseDuration(entity.attributes.remaining);
  }

  /** Timer progress in [0, 1]. */
  private _progressFraction(entity: TimerEntity): number {
    if (entity.state === 'idle') return 0;
    const total = parseDuration(entity.attributes.duration);
    if (total <= 0) return 0;
    const remaining = this._remainingSeconds(entity);
    return Math.min(1, Math.max(0, (total - remaining) / total));
  }

  /** Seconds passed to timer.start when Start is clicked. */
  private _dialedSeconds(entity: TimerEntity): number {
    if (this._inputSeconds !== undefined) return this._inputSeconds;
    return parseDuration(entity.attributes.duration);
  }

  private async _callService(
    service: string,
    entity: TimerEntity,
    data: Record<string, unknown> = {},
  ): Promise<void> {
    if (!this.hass) return;
    await this.hass.callService('timer', service, { entity_id: entity.entity_id, ...data });
  }

  private _start(entity: TimerEntity): void {
    const seconds = this._dialedSeconds(entity);
    void this._callService('start', entity, { duration: toServiceDuration(seconds) });
  }

  private _resume(entity: TimerEntity): void {
    void this._callService('start', entity);
  }

  private _pause(entity: TimerEntity): void {
    void this._callService('pause', entity);
  }

  private _cancel(entity: TimerEntity): void {
    void this._callService('cancel', entity);
  }

  private _openModal(entity: TimerEntity): void {
    this._modalSeconds = this._dialedSeconds(entity);
    // Render first so the dialog reflects _modalSeconds before showModal grabs focus.
    this.updateComplete.then(() => this._dialog?.showModal());
  }

  private _closeModal(): void {
    this._dialog?.close();
  }

  private _saveModal(): void {
    this._inputSeconds = this._modalSeconds;
    this._closeModal();
  }

  private _onModalInputChange(field: 'h' | 'm59' | 's59', e: Event): void {
    const input = e.target as HTMLInputElement;
    let value = Number(input.value);
    if (!Number.isFinite(value) || value < 0) value = 0;
    if (field === 'm59' || field === 's59') value = Math.min(59, Math.floor(value));
    else value = Math.floor(value);

    const { h, m, s } = splitHMS(this._modalSeconds);
    const next = {
      h: field === 'h' ? value : h,
      m: field === 'm59' ? value : m,
      s: field === 's59' ? value : s,
    };
    this._modalSeconds = next.h * 3600 + next.m * 60 + next.s;
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) return nothing;

    const entity = this._entity;
    if (!entity) {
      return html`
        <ha-card>
          <div class="warning">Entity not found: ${this._config.entity}</div>
        </ha-card>
      `;
    }

    const compact = !!this._config.compact;
    const name = this._config.name ?? entity.attributes.friendly_name ?? entity.entity_id;
    const iconName = this._config.icon ?? entity.attributes.icon ?? DEFAULT_ICON;
    const stateLabel = STATE_LABELS[entity.state] ?? entity.state;
    const isIdle = entity.state === 'idle';
    const displaySeconds = isIdle ? this._dialedSeconds(entity) : this._remainingSeconds(entity);
    const warn =
      entity.state === 'active' && displaySeconds > 0 && displaySeconds <= WARN_THRESHOLD_SECONDS;
    const progress = this._progressFraction(entity);

    return html`
      <ha-card>
        <div class="content" data-compact=${compact ? 'true' : 'false'}>
          <div class="header">
            <ha-icon class="icon" .icon=${iconName}></ha-icon>
            <span class="name">${name}</span>
          </div>
          ${isIdle
            ? html`
                <button
                  type="button"
                  class="time time-clickable"
                  data-state="idle"
                  @click=${() => this._openModal(entity)}
                  aria-label="Edit duration"
                  title="Click to set duration"
                >
                  ${formatDuration(displaySeconds)}
                </button>
              `
            : html`
                <div
                  class="time"
                  data-state=${entity.state}
                  data-warn=${warn ? 'true' : 'false'}
                >
                  ${formatDuration(displaySeconds)}
                </div>
              `}
          <div class="state" data-state=${entity.state} aria-live="polite">${stateLabel}</div>
          <div class="actions">${this._renderActions(entity)}</div>
        </div>
        <div class="progress" style=${styleMap({ '--progress': String(progress) })}></div>
      </ha-card>
      ${this._renderModal()}
    `;
  }

  private _renderModal(): TemplateResult {
    const { h, m, s } = splitHMS(this._modalSeconds);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return html`
      <dialog class="modal">
        <div class="modal-content">
          <div class="modal-title">Set duration</div>
          <div class="modal-inputs">
            <input
              type="number"
              inputmode="numeric"
              min="0"
              aria-label="hours"
              .value=${String(h)}
              @change=${(e: Event) => this._onModalInputChange('h', e)}
            />
            <span>:</span>
            <input
              type="number"
              inputmode="numeric"
              min="0"
              max="59"
              aria-label="minutes"
              .value=${pad(m)}
              @change=${(e: Event) => this._onModalInputChange('m59', e)}
            />
            <span>:</span>
            <input
              type="number"
              inputmode="numeric"
              min="0"
              max="59"
              aria-label="seconds"
              .value=${pad(s)}
              @change=${(e: Event) => this._onModalInputChange('s59', e)}
            />
          </div>
          <div class="modal-actions">
            <button class="btn" type="button" @click=${this._closeModal}>Cancel</button>
            <button class="btn primary" type="button" @click=${this._saveModal}>Save</button>
          </div>
        </div>
      </dialog>
    `;
  }

  private _renderActions(entity: TimerEntity): TemplateResult {
    switch (entity.state) {
      case 'idle':
        return html`
          <button class="btn primary" @click=${() => this._start(entity)} aria-label="Start timer">
            Start
          </button>
        `;
      case 'active':
        return html`
          <button class="btn primary" @click=${() => this._pause(entity)} aria-label="Pause timer">
            Pause
          </button>
          <button class="btn" @click=${() => this._cancel(entity)} aria-label="Cancel timer">
            Cancel
          </button>
        `;
      case 'paused':
        return html`
          <button class="btn primary" @click=${() => this._resume(entity)} aria-label="Resume timer">
            Resume
          </button>
          <button class="btn" @click=${() => this._cancel(entity)} aria-label="Cancel timer">
            Cancel
          </button>
        `;
    }
  }

  static override styles = css`
    :host {
      display: block;
    }
    ha-card {
      position: relative;
      overflow: hidden;
    }
    .content {
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary-text-color);
    }
    .icon {
      --mdc-icon-size: 24px;
      color: var(--state-icon-color, var(--primary-text-color));
    }
    .name {
      font-weight: 500;
      font-size: 1rem;
    }

    .time {
      font-size: 3rem;
      font-weight: 300;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color);
      line-height: 1.1;
      letter-spacing: -0.02em;
      display: flex;
      align-items: baseline;
      justify-content: center;
      min-height: 3.3rem;
    }
    .time[data-state='paused'] {
      color: var(--secondary-text-color);
    }
    .time[data-warn='true'] {
      color: var(--warning-color, #ff9800);
    }
    @media (prefers-reduced-motion: no-preference) {
      .time[data-warn='true'] {
        animation: stc-pulse 1s ease-in-out infinite;
      }
    }
    @keyframes stc-pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.55;
      }
    }

    .time-clickable {
      font: inherit;
      color: inherit;
      background: transparent;
      border: none;
      padding: 0 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .time-clickable:hover {
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
    }
    .time-clickable:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .state {
      color: var(--secondary-text-color);
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .state[data-state='active'] {
      color: var(--success-color, var(--primary-color));
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .btn {
      font: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 999px;
      border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
      background: transparent;
      color: var(--primary-text-color);
      cursor: pointer;
      min-width: 80px;
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease;
    }
    .btn:hover {
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
    }
    .btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .btn.primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, white);
    }
    .btn.primary:hover {
      filter: brightness(1.05);
    }

    .progress {
      height: 3px;
      background: var(--divider-color, rgba(127, 127, 127, 0.15));
      position: relative;
      overflow: hidden;
    }
    .progress::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--primary-color);
      transform-origin: left;
      transform: scaleX(var(--progress, 0));
      transition: transform 0.25s linear;
    }

    .warning {
      padding: 16px;
      color: var(--error-color, #db4437);
    }

    /* Compact mode */
    .content[data-compact='true'] {
      padding: 12px;
      gap: 4px;
    }
    .content[data-compact='true'] .icon {
      --mdc-icon-size: 20px;
    }
    .content[data-compact='true'] .name {
      font-size: 0.875rem;
    }
    .content[data-compact='true'] .time {
      font-size: 1.75rem;
      min-height: 1.9rem;
    }
    .content[data-compact='true'] .btn {
      padding: 6px 12px;
      font-size: 0.8125rem;
      min-width: 64px;
    }
    .content[data-compact='true'] .actions {
      margin-top: 2px;
    }

    /* Duration picker modal */
    .modal {
      border: none;
      border-radius: 14px;
      padding: 0;
      background: var(--card-background-color, white);
      color: var(--primary-text-color);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
      max-width: 90vw;
    }
    .modal::backdrop {
      background: rgba(0, 0, 0, 0.45);
    }
    .modal-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 240px;
    }
    .modal-title {
      font-weight: 500;
      font-size: 1rem;
    }
    .modal-inputs {
      display: flex;
      align-items: baseline;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: 300;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color);
    }
    .modal-inputs input {
      width: 2.2ch;
      font: inherit;
      color: inherit;
      background: transparent;
      border: none;
      border-bottom: 1px dashed var(--divider-color, rgba(127, 127, 127, 0.3));
      text-align: center;
      padding: 0;
      outline: none;
      -moz-appearance: textfield;
    }
    .modal-inputs input::-webkit-inner-spin-button,
    .modal-inputs input::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .modal-inputs input:focus {
      border-bottom-color: var(--primary-color);
    }
    .modal-inputs span {
      margin: 0 0.05em;
      color: var(--secondary-text-color);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-timer-card': SimpleTimerCard;
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: 'simple-timer-card',
  name: 'Simple Timer',
  description: 'A simple card to view and control a Home Assistant timer.',
  preview: true,
});

console.info(
  `%c SIMPLE-TIMER-CARD %c v${VERSION} `,
  'color:white;background:#03a9f4;font-weight:bold;',
  'color:#03a9f4;background:white;font-weight:bold;',
);
