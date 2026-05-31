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
  /** Registry of available services, keyed by domain then service name. */
  services?: Record<string, Record<string, unknown>>;
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: HassServiceTarget,
  ) => Promise<unknown>;
  themes?: { darkMode?: boolean };
  language?: string;
  /** HA's frontend translator. Returns '' for an unknown key. */
  localize?: (key: string, ...args: unknown[]) => string;
}

export interface HassServiceTarget {
  entity_id?: string | string[];
  device_id?: string | string[];
  area_id?: string | string[];
}

export interface TapAction {
  /**
   * Standard HA actions ('more-info' | 'call-service' | 'navigate' | 'url' |
   * 'none' | …) plus card-specific values:
   *   - 'modal' / 'default' — open the duration picker (the built-in tap default)
   *   - 'reset-duration'    — clear the dialed override, reverting to the helper's
   *                           stored duration
   */
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
  adjust?: boolean;
  adjust_step?: number;
  tap_action?: TapAction;
  hold_action?: TapAction;
  double_tap_action?: TapAction;
}
