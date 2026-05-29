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
}

export interface TimerEntity extends Omit<HassEntity, 'state' | 'attributes'> {
  state: 'idle' | 'active' | 'paused';
  attributes: TimerEntityAttributes;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: HassServiceTarget,
  ) => Promise<unknown>;
  themes?: { darkMode?: boolean };
  language?: string;
}

export interface HassServiceTarget {
  entity_id?: string | string[];
  device_id?: string | string[];
  area_id?: string | string[];
}

export interface TapAction {
  /** 'more-info' | 'toggle' | 'call-service' | 'navigate' | 'url' | 'none' | (anything HA might add) */
  action: string;
  entity?: string;
  navigation_path?: string;
  url_path?: string;
  service?: string;
  service_data?: Record<string, unknown>;
  target?: HassServiceTarget;
}

export interface SimpleTimerCardConfig {
  type: string;
  entity: string;
  name?: string;
  icon?: string;
  color?: string;
  compact?: boolean;
  hide_name?: boolean;
  hide_icon?: boolean;
  hide_state?: boolean;
  show_progress?: boolean;
  warn_threshold_seconds?: number;
  tap_action?: TapAction;
}
