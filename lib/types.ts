export interface TelemetryRow {
  id: number;
  recorded_at: string;
  floor: 1 | 2;
  current_temp: number;
  humidity: number | null;
  outdoor_temp: number | null;
  outdoor_humidity: number | null;
  wind_speed: number | null;
  wind_bearing: number | null;
  hvac_action: "heating" | "cooling" | "idle" | "off" | null;
  hvac_mode: "heat" | "cool" | "heat_cool" | "off" | null;
  setpoint: number | null;
  heat_rate: number | null;
  cool_rate: number | null;
  lead_minutes: number | null;
  precon_active: 0 | 1 | null;
  control_source: "auto" | "manual";
}

export interface SetpointChangeRow {
  id: number;
  changed_at: string;
  floor: 1 | 2;
  previous_setpoint: number | null;
  new_setpoint: number;
  hvac_mode: "heat" | "cool";
  reason:
    | "schedule_day"
    | "schedule_night"
    | "schedule_afternoon"
    | "precon"
    | "manual_override"
    | null;
}

export interface RateHistoryRow {
  id: number;
  recorded_at: string;
  floor: 1 | 2;
  heat_rate: number;
  cool_rate: number;
  outdoor_temp: number | null;
  outdoor_factor: number | null;
}

export interface StateRow {
  floor: 1 | 2;
  updated_at: string;
  heat_rate: number;
  cool_rate: number;
  last_temp: number;
  last_ts: number;
  last_action: string;
  last_mode: "heat" | "cool";
  last_mode_switch_ts: number;
  cycle_start_temp: number;
  cycle_start_temp_prev: number;
  cycle_start_ts: number;
  last_outside: number;
  last_script_setpoint: number;
  last_script_mode: "heat" | "cool";
}

export interface MetaResponse {
  floor: number | "all";
  telemetry: { count: number; oldest: string; newest: string };
  setpoint_changes: { count: number; oldest: string; newest: string };
  rate_history: { count: number; oldest: string; newest: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  has_more: boolean;
  next_cursor: number | null;
}

export type FloorFilter = 1 | 2 | "all";

export interface FetchParams {
  floor?: FloorFilter;
  from?: string;
  to?: string;
  after_id?: number;
  limit?: number;
  sort?: "asc" | "desc";
}
