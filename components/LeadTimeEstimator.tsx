"use client";

import type { TelemetryRow } from "@/lib/types";
import type { ThermalParams } from "@/lib/pid";
import { computeLeadTime } from "@/lib/pid";
import { Wind, Thermometer, Droplets } from "lucide-react";

interface LeadTimeEstimatorProps {
  floor1: TelemetryRow | null;
  floor2: TelemetryRow | null;
  params: ThermalParams[];
}

function getMode(row: TelemetryRow): "heat" | "cool" | null {
  if (row.hvac_mode === "heat") return "heat";
  if (row.hvac_mode === "cool") return "cool";
  if (row.hvac_action === "heating") return "heat";
  if (row.hvac_action === "cooling") return "cool";
  return null;
}

function DeltaBadge({ diff }: { diff: number }) {
  const abs = Math.abs(diff);
  const label = diff > 0 ? `+${diff.toFixed(1)} min long` : `${diff.toFixed(1)} min short`;
  const style =
    abs <= 2
      ? "bg-green-400/20 text-green-300 border border-green-400/30"
      : abs <= 5
      ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
      : "bg-red-400/20 text-red-300 border border-red-400/30";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

function FloorEstimate({
  floor,
  row,
  params,
}: {
  floor: 1 | 2;
  row: TelemetryRow | null;
  params: ThermalParams[];
}) {
  if (!row) {
    return (
      <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
        <p className="text-slate-500 text-sm">No data for Floor {floor}</p>
      </div>
    );
  }

  const mode = getMode(row);
  const matchingParams = params.find(
    (p) => p.floor === floor && p.mode === (mode ?? "heat")
  );

  const deltaTemp =
    row.setpoint !== null
      ? Math.abs(row.setpoint - row.current_temp)
      : null;

  const computedLead =
    deltaTemp !== null && matchingParams
      ? computeLeadTime(deltaTemp, matchingParams)
      : null;

  const assignedLead = row.lead_minutes;
  const diff =
    computedLead !== null && assignedLead !== null
      ? assignedLead - computedLead
      : null;

  return (
    <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-300 font-semibold">Floor {floor}</span>
        {mode && (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              mode === "heat"
                ? "bg-amber-400/20 text-amber-300"
                : "bg-sky-400/20 text-sky-300"
            }`}
          >
            {mode === "heat" ? "Heat" : "Cool"} mode
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide">Current</p>
          <p className="font-mono text-white">{row.current_temp.toFixed(1)}°F</p>
        </div>
        {row.setpoint !== null && (
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">Setpoint</p>
            <p className="font-mono text-white">{row.setpoint.toFixed(1)}°F</p>
          </div>
        )}
        {deltaTemp !== null && (
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">Δ Temp</p>
            <p className="font-mono text-slate-200">{deltaTemp.toFixed(1)}°F</p>
          </div>
        )}
        {matchingParams && (
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">
              Effective rate
            </p>
            <p className="font-mono text-slate-200">
              {(matchingParams.learnedRate * matchingParams.outdoorFactor).toFixed(4)}°F/min
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-600/50 pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide">Computed lead</p>
          <p className="font-mono text-white text-lg">
            {computedLead !== null ? `${computedLead.toFixed(1)} min` : "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide">Assigned lead</p>
          <p className="font-mono text-slate-300 text-lg">
            {assignedLead !== null ? `${assignedLead} min` : "—"}
          </p>
        </div>
      </div>

      {diff !== null && (
        <div className="flex items-center gap-2">
          <p className="text-slate-400 text-xs">Assigned vs computed:</p>
          <DeltaBadge diff={diff} />
        </div>
      )}

      {!matchingParams && (
        <p className="text-slate-500 text-xs">
          No thermal params available for {mode ?? "current"} mode
        </p>
      )}
    </div>
  );
}

export default function LeadTimeEstimator({
  floor1,
  floor2,
  params,
}: LeadTimeEstimatorProps) {
  const outdoor = floor1 ?? floor2;

  return (
    <div className="flex flex-col gap-4">
      {outdoor && (
        <div className="flex flex-wrap gap-4 text-sm bg-slate-700/20 rounded-lg px-4 py-3 border border-slate-600/50">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5" />
            Current outdoor conditions
          </span>
          {outdoor.outdoor_temp !== null && (
            <span className="font-mono text-slate-200">
              {Number(outdoor.outdoor_temp).toFixed(1)}°F
            </span>
          )}
          {outdoor.outdoor_humidity !== null && (
            <span className="flex items-center gap-1 text-slate-300">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              {Number(outdoor.outdoor_humidity).toFixed(0)}%
            </span>
          )}
          {outdoor.wind_speed !== null && (
            <span className="flex items-center gap-1 text-slate-300">
              <Wind className="w-3.5 h-3.5 text-slate-400" />
              {Number(outdoor.wind_speed).toFixed(0)} mph
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FloorEstimate floor={1} row={floor1} params={params} />
        <FloorEstimate floor={2} row={floor2} params={params} />
      </div>

      <p className="text-slate-500 text-xs">
        Computed lead = Δtemp ÷ (learned rate × outdoor factor). Outdoor factor
        is an EMA over the selected window — it captures the combined influence
        of temperature, wind, and humidity as observed in historical data.
        Wind and humidity correlations will be broken out separately as more
        data accumulates.
      </p>
    </div>
  );
}
