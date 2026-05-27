export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface TimerEntityAttributes {
  duration?: string;
  remaining?: string;
  finishes_at?: string;
  friendly_name?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface TimerEntity extends HassEntity {
  state: 'idle' | 'active' | 'paused';
  attributes: TimerEntityAttributes;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ) => Promise<unknown>;
  themes?: { darkMode?: boolean };
  language?: string;
}

export interface SimpleTimerCardConfig {
  type: string;
  entity: string;
  name?: string;
  icon?: string;
  compact?: boolean;
}

declare global {
  interface Window {
    customCards?: Array<{
      type: string;
      name: string;
      description?: string;
      preview?: boolean;
      documentationURL?: string;
    }>;
  }
}
