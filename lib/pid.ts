import type { RateHistoryRow } from "./types";

// ---------------------------------------------------------------------------
// Thermal characterisation
// ---------------------------------------------------------------------------

export interface ThermalParams {
  floor: 1 | 2;
  mode: "heat" | "cool";
  /** EMA-smoothed rate in °F/min */
  learnedRate: number;
  /** EMA-smoothed outdoor factor (captures temp, wind, humidity influence) */
  outdoorFactor: number;
  /** Number of rate_history rows that fed this estimate */
  sampleCount: number;
}

/**
 * Exponential moving average (α = 0.2).
 * Recent readings carry more weight while older history still smooths noise.
 * Rows should be sorted oldest-first so the EMA converges toward current state.
 */
function ema(values: number[], alpha = 0.2): number {
  if (values.length === 0) return 0;
  let result = values[0];
  for (let i = 1; i < values.length; i++) {
    result = alpha * values[i] + (1 - alpha) * result;
  }
  return result;
}

export function computeThermalParam(
  floor: 1 | 2,
  mode: "heat" | "cool",
  rows: RateHistoryRow[]
): ThermalParams | null {
  const floorRows = rows.filter((r) => r.floor === floor);
  if (floorRows.length === 0) return null;

  const rateValues = floorRows.map((r) =>
    mode === "heat" ? r.heat_rate : r.cool_rate
  );
  const factorValues = floorRows
    .map((r) => r.outdoor_factor)
    .filter((v): v is number => v !== null);

  const learnedRate = ema(rateValues);
  const outdoorFactor = factorValues.length > 0 ? ema(factorValues) : 1.0;

  if (learnedRate <= 0) return null;

  return {
    floor,
    mode,
    learnedRate,
    outdoorFactor,
    sampleCount: floorRows.length,
  };
}

export function computeAllThermalParams(rows: RateHistoryRow[]): ThermalParams[] {
  const combos: Array<{ floor: 1 | 2; mode: "heat" | "cool" }> = [
    { floor: 1, mode: "heat" },
    { floor: 1, mode: "cool" },
    { floor: 2, mode: "heat" },
    { floor: 2, mode: "cool" },
  ];
  return combos
    .map(({ floor, mode }) => computeThermalParam(floor, mode, rows))
    .filter((s): s is ThermalParams => s !== null);
}

/**
 * Estimate minutes needed to bridge a temperature gap given learned thermal params.
 *
 *   effectiveRate = learnedRate × outdoorFactor
 *   leadMinutes   = deltaTemp / effectiveRate
 *
 * deltaTemp should be positive (caller takes Math.abs if needed).
 * Returns null if rate is zero or params are missing.
 */
export function computeLeadTime(
  deltaTemp: number,
  params: ThermalParams
): number | null {
  const effectiveRate = params.learnedRate * params.outdoorFactor;
  if (effectiveRate <= 0 || deltaTemp <= 0) return null;
  return deltaTemp / effectiveRate;
}

// ---------------------------------------------------------------------------
// Precon event detection
// ---------------------------------------------------------------------------

export interface PreconEvent {
  floor: 1 | 2;
  startAt: string;
  endAt: string;
  leadMinutes: number | null;
  startTemp: number;
  targetSetpoint: number;
  endTemp: number;
  deltaAtTransition: number;
}

/**
 * Detect contiguous precon_active=1 blocks in a sorted (asc) telemetry array
 * and compute accuracy metrics for each event.
 *
 * deltaAtTransition > 0  → didn't reach setpoint (short)
 * deltaAtTransition < 0  → overshot (long)
 */
export function detectPreconEvents(
  rows: Array<{
    floor: 1 | 2;
    recorded_at: string;
    current_temp: number;
    setpoint: number | null;
    precon_active: 0 | 1 | null;
    hvac_action: string | null;
    lead_minutes: number | null;
  }>
): PreconEvent[] {
  const events: PreconEvent[] = [];
  const floors: Array<1 | 2> = [1, 2];

  for (const floor of floors) {
    const floorRows = rows
      .filter((r) => r.floor === floor)
      .sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );

    let inBlock = false;
    let blockStart = -1;

    for (let i = 0; i < floorRows.length; i++) {
      const active = floorRows[i].precon_active === 1;
      if (active && !inBlock) {
        inBlock = true;
        blockStart = i;
      } else if (!active && inBlock) {
        inBlock = false;
        const lastInBlock = floorRows[i - 1];
        const firstAfter = floorRows[i];
        const startRow = floorRows[blockStart];
        if (lastInBlock.setpoint !== null) {
          events.push({
            floor,
            startAt: startRow.recorded_at,
            endAt: lastInBlock.recorded_at,
            leadMinutes: startRow.lead_minutes,
            startTemp: startRow.current_temp,
            targetSetpoint: lastInBlock.setpoint,
            endTemp: firstAfter.current_temp,
            deltaAtTransition:
              lastInBlock.setpoint - firstAfter.current_temp,
          });
        }
      }
    }
  }

  return events;
}

export interface PreconStats {
  mean: number;
  withinOne: number;
  withinTwo: number;
  count: number;
}

export function computePreconStats(events: PreconEvent[]): PreconStats {
  if (events.length === 0)
    return { mean: 0, withinOne: 0, withinTwo: 0, count: 0 };
  const deltas = events.map((e) => e.deltaAtTransition);
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const withinOne =
    (deltas.filter((d) => Math.abs(d) <= 1).length / deltas.length) * 100;
  const withinTwo =
    (deltas.filter((d) => Math.abs(d) <= 2).length / deltas.length) * 100;
  return { mean, withinOne, withinTwo, count: events.length };
}
