import type {
  TelemetryRow,
  SetpointChangeRow,
  RateHistoryRow,
  MetaResponse,
  PaginatedResponse,
  FetchParams,
  FloorFilter,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_SIDECAR_URL || "http://10.0.0.240:3077";

// MariaDB drivers often return numeric columns as strings over JSON.
// These coercers normalise every row to the typed shape.
function num(v: unknown): number {
  return Number(v);
}
function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  return Number(v);
}

function coerceTelemetry(r: TelemetryRow): TelemetryRow {
  return {
    ...r,
    id: num(r.id),
    floor: num(r.floor) as 1 | 2,
    current_temp: num(r.current_temp),
    humidity: numOrNull(r.humidity),
    outdoor_temp: numOrNull(r.outdoor_temp),
    outdoor_humidity: numOrNull(r.outdoor_humidity),
    wind_speed: numOrNull(r.wind_speed),
    wind_bearing: numOrNull(r.wind_bearing),
    setpoint: numOrNull(r.setpoint),
    heat_rate: numOrNull(r.heat_rate),
    cool_rate: numOrNull(r.cool_rate),
    lead_minutes: numOrNull(r.lead_minutes),
    precon_active:
      r.precon_active === null ? null : (num(r.precon_active) as 0 | 1),
  };
}

function coerceSetpointChange(r: SetpointChangeRow): SetpointChangeRow {
  return {
    ...r,
    id: num(r.id),
    floor: num(r.floor) as 1 | 2,
    previous_setpoint: numOrNull(r.previous_setpoint),
    new_setpoint: num(r.new_setpoint),
  };
}

function coerceRateHistory(r: RateHistoryRow): RateHistoryRow {
  return {
    ...r,
    id: num(r.id),
    floor: num(r.floor) as 1 | 2,
    heat_rate: num(r.heat_rate),
    cool_rate: num(r.cool_rate),
    outdoor_temp: numOrNull(r.outdoor_temp),
    outdoor_factor: numOrNull(r.outdoor_factor),
  };
}

function buildQuery(params: FetchParams): string {
  const q = new URLSearchParams();
  if (params.floor !== undefined && params.floor !== "all")
    q.set("floor", String(params.floor));
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.after_id !== undefined)
    q.set("after_id", String(params.after_id));
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.sort) q.set("sort", params.sort);
  const str = q.toString();
  return str ? `?${str}` : "";
}

async function fetchPage<T>(
  path: string,
  params: FetchParams
): Promise<PaginatedResponse<T>> {
  const url = `${BASE_URL}${path}${buildQuery(params)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sidecar error ${res.status}: ${url}`);
  return res.json();
}

async function fetchAll<T>(path: string, params: FetchParams): Promise<T[]> {
  const rows: T[] = [];
  let cursor: number | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const page: PaginatedResponse<T> = await fetchPage<T>(path, {
      ...params,
      after_id: cursor,
      limit: params.limit ?? 500,
    });
    rows.push(...page.data);
    hasMore = page.has_more;
    cursor = page.next_cursor ?? undefined;
    if (!hasMore || cursor === undefined) break;
  }

  return rows;
}

export async function getTelemetry(params: FetchParams): Promise<TelemetryRow[]> {
  const rows = await fetchAll<TelemetryRow>("/telemetry", params);
  return rows.map(coerceTelemetry);
}

export async function getSetpointChanges(
  params: FetchParams
): Promise<SetpointChangeRow[]> {
  const rows = await fetchAll<SetpointChangeRow>("/setpoint-changes", params);
  return rows.map(coerceSetpointChange);
}

export async function getSetpointChangesPage(
  params: FetchParams
): Promise<PaginatedResponse<SetpointChangeRow>> {
  const page = await fetchPage<SetpointChangeRow>("/setpoint-changes", params);
  return { ...page, data: page.data.map(coerceSetpointChange) };
}

export async function getRateHistory(
  params: FetchParams
): Promise<RateHistoryRow[]> {
  const rows = await fetchAll<RateHistoryRow>("/rate-history", params);
  return rows.map(coerceRateHistory);
}

export async function getMeta(floor?: FloorFilter): Promise<MetaResponse> {
  const q = floor !== undefined && floor !== "all" ? `?floor=${floor}` : "";
  const res = await fetch(`${BASE_URL}/meta${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sidecar error ${res.status}`);
  return res.json();
}

export async function getLatestTelemetry(
  floor: 1 | 2
): Promise<TelemetryRow | null> {
  const page = await fetchPage<TelemetryRow>("/telemetry", {
    floor,
    sort: "desc",
    limit: 1,
  });
  const row = page.data[0] ?? null;
  return row ? coerceTelemetry(row) : null;
}

export function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export function daysAgo(days: number): string {
  return hoursAgo(days * 24);
}
