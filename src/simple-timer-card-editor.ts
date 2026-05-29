import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, SimpleTimerCardConfig } from './types.js';

interface HaFormSchemaItem {
  name: string;
  required?: boolean;
  default?: unknown;
  selector: Record<string, unknown>;
}

const SCHEMA: HaFormSchemaItem[] = [
  { name: 'entity', required: true, selector: { entity: { domain: 'timer' } } },
  { name: 'name', selector: { text: {} } },
  { name: 'icon', selector: { icon: {} } },
  { name: 'color', selector: { text: {} } },
  { name: 'compact', selector: { boolean: {} }, default: false },
  { name: 'show_progress', selector: { boolean: {} }, default: true },
  { name: 'hide_icon', selector: { boolean: {} }, default: false },
  { name: 'hide_name', selector: { boolean: {} }, default: false },
  { name: 'hide_state', selector: { boolean: {} }, default: false },
  {
    name: 'warn_threshold_seconds',
    selector: { number: { min: 0, mode: 'box', unit_of_measurement: 's' } },
  },
  { name: 'tap_action', selector: { ui_action: {} } },
];

const LABELS: Record<string, string> = {
  entity: 'Timer entity (required)',
  name: 'Name',
  icon: 'Icon',
  color: 'Accent color (e.g. #e91e63 or tomato)',
  compact: 'Compact layout',
  show_progress: 'Show progress bar',
  hide_icon: 'Hide icon',
  hide_name: 'Hide name',
  hide_state: 'Hide state label',
  warn_threshold_seconds: 'Warning threshold (0 disables)',
  tap_action: 'Tap action on time',
};

@customElement(`simple-timer-card-editor${__CARD_NAME_SUFFIX__}`)
export class SimpleTimerCardEditor extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private _config?: SimpleTimerCardConfig;

  public setConfig(config: SimpleTimerCardConfig): void {
    this._config = config;
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _computeLabel = (schema: { name: string }): string => {
    return LABELS[schema.name] ?? schema.name;
  };

  private _valueChanged(ev: CustomEvent<{ value: SimpleTimerCardConfig }>): void {
    const raw = { ...ev.detail.value } as Record<string, unknown>;

    // Strip empty strings only; preserve all explicit boolean and number values.
    // (Earlier "strip when value matches default" logic raced with ha-form's
    // value-changed event and caused toggles to visibly reset.)
    for (const key of ['name', 'icon', 'color'] as const) {
      const v = raw[key];
      if (v === undefined || v === null || v === '') delete raw[key];
    }
    for (const key of [
      'compact',
      'hide_icon',
      'hide_name',
      'hide_state',
      'show_progress',
    ] as const) {
      if (raw[key] === undefined || raw[key] === null) delete raw[key];
    }
    if (raw.warn_threshold_seconds === undefined || raw.warn_threshold_seconds === null) {
      delete raw.warn_threshold_seconds;
    }
    const tap = raw.tap_action as { action?: string } | undefined;
    if (!tap || tap.action === undefined || tap.action === 'default') {
      delete raw.tap_action;
    }

    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: raw as unknown as SimpleTimerCardConfig },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-timer-card-editor': SimpleTimerCardEditor;
  }
}
