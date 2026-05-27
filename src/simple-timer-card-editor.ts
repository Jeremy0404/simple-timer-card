import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, SimpleTimerCardConfig } from './types.js';

interface HaFormSchemaItem {
  name: string;
  required?: boolean;
  selector: Record<string, unknown>;
}

const SCHEMA: HaFormSchemaItem[] = [
  { name: 'entity', required: true, selector: { entity: { domain: 'timer' } } },
  { name: 'name', selector: { text: {} } },
  { name: 'icon', selector: { icon: {} } },
  { name: 'compact', selector: { boolean: {} } },
];

const LABELS: Record<string, string> = {
  entity: 'Timer entity (required)',
  name: 'Name',
  icon: 'Icon',
  compact: 'Compact layout',
};

@customElement('simple-timer-card-editor')
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

    // Strip optional fields with empty/falsy values so the saved YAML stays clean.
    for (const key of ['name', 'icon'] as const) {
      const v = raw[key];
      if (v === undefined || v === null || v === '') delete raw[key];
    }
    if (!raw.compact) delete raw.compact;

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
