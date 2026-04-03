"use client";

import type { TelemetryRow } from "@/lib/types";
import { formatTimeOnly } from "@/lib/format";
import { Wind } from "lucide-react";

interface FloorCardProps {
  floor: 1 | 2;
  data: TelemetryRow | null;
}

function HvacDot({ action }: { action: TelemetryRow["hvac_action"] }) {
  if (action === "heating")
    return (
      <span className="relative flex items-center gap-1.5">
        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />
        <span className="text-red-400 text-xs font-medium">Heating</span>
      </span>
    );
  if (action === "cooling")
    return (
      <span className="relative flex items-center gap-1.5">
        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-sky-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400" />
        <span className="text-sky-400 text-xs font-medium">Cooling</span>
      </span>
    );
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-500" />
      <span className="text-slate-400 text-xs font-medium">
        {action === "off" ? "Off" : "Idle"}
      </span>
    </span>
  );
}

function ModeBadge({ mode }: { mode: TelemetryRow["hvac_mode"] }) {
  const styles: Record<string, string> = {
    heat: "bg-amber-400/20 text-amber-300 border border-amber-400/30",
    cool: "bg-sky-400/20 text-sky-300 border border-sky-400/30",
    heat_cool: "bg-violet-400/20 text-violet-300 border border-violet-400/30",
    off: "bg-slate-600/40 text-slate-400 border border-slate-600",
  };
  const labels: Record<string, string> = {
    heat: "Heat",
    cool: "Cool",
    heat_cool: "Heat/Cool",
    off: "Off",
  };
  const key = mode ?? "off";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[key] ?? styles.off}`}>
      {labels[key] ?? "—"}
    </span>
  );
}

export default function FloorCard({ floor, data }: FloorCardProps) {
  if (!data) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center min-h-[220px]">
        <p className="text-slate-500 text-sm">No data for Floor {floor}</p>
      </div>
    );
  }

  const isManual = data.control_source === "manual";

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-300 font-semibold text-base">
          Floor {floor}
        </h2>
        <div className="flex items-center gap-2">
          {data.precon_active === 1 && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-400/20 text-violet-300 border border-violet-400/30">
              Precon
            </span>
          )}
          {isManual ? (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-400/20 text-orange-300 border border-orange-400/30">
              Manual Override
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-600/40 text-slate-400 border border-slate-600">
              Auto
            </span>
          )}
        </div>
      </div>

      <div className="flex items-end gap-4">
        <span className="font-mono text-5xl font-bold text-white tabular-nums">
          {data.current_temp.toFixed(1)}°F
        </span>
        <div className="flex flex-col gap-1 pb-1">
          {data.setpoint !== null && (
            <span className="text-slate-400 text-sm">
              Setpoint:{" "}
              <span className="font-mono font-semibold text-slate-200">
                {data.setpoint.toFixed(1)}°F
              </span>
            </span>
          )}
          <ModeBadge mode={data.hvac_mode} />
        </div>
      </div>

      <HvacDot action={data.hvac_action} />

      <div className="grid grid-cols-2 gap-2 text-sm">
        {data.humidity !== null && (
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs uppercase tracking-wide">
              Indoor Humidity
            </span>
            <span className="font-mono text-slate-200">
              {data.humidity.toFixed(0)}%
            </span>
          </div>
        )}
        {data.lead_minutes !== null && (
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs uppercase tracking-wide">
              Lead Time
            </span>
            <span className="font-mono text-slate-200">
              {data.lead_minutes} min
            </span>
          </div>
        )}
      </div>

      <p className="text-slate-600 text-xs mt-auto">
        Updated{" "}
        {formatTimeOnly(data.recorded_at)}
      </p>
    </div>
  );
}
