"use client";

import { useEffect, useState } from "react";
import TempChart from "@/components/TempChart";
import HumidityChart from "@/components/HumidityChart";
import LeadMinutesChart from "@/components/LeadMinutesChart";
import PreconActivityChart from "@/components/PreconActivityChart";
import type { TelemetryRow } from "@/lib/types";
import { getTelemetry, hoursAgo, daysAgo } from "@/lib/api";

type Range = "6h" | "24h" | "7d" | "30d";
type FloorSel = "1" | "2" | "both";

const RANGES: { label: string; value: Range }[] = [
  { label: "Last 6h", value: "6h" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7d", value: "7d" },
  { label: "Last 30d", value: "30d" },
];

function fromForRange(range: Range): string {
  switch (range) {
    case "6h": return hoursAgo(6);
    case "24h": return hoursAgo(24);
    case "7d": return daysAgo(7);
    case "30d": return daysAgo(30);
  }
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  );
}

export default function HistoryPage() {
  const [range, setRange] = useState<Range>("24h");
  const [floorSel, setFloorSel] = useState<FloorSel>("both");
  const [rows, setRows] = useState<TelemetryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getTelemetry({
          from: fromForRange(range),
          sort: "asc",
          limit: 500,
        });
        if (cancelled) return;
        setRows(data);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [range]);

  const activeFloors: (1 | 2)[] =
    floorSel === "both" ? [1, 2] : floorSel === "1" ? [1] : [2];

  const filteredRows = rows.filter((r) =>
    floorSel === "both" ? true : r.floor === Number(floorSel)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">Telemetry History</h1>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  range === r.value
                    ? "bg-slate-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
            {(["1", "2", "both"] as FloorSel[]).map((f) => (
              <button
                key={f}
                onClick={() => setFloorSel(f)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  floorSel === f
                    ? "bg-slate-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f === "both" ? "Both" : `Floor ${f}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 h-72 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ChartCard title="Temperature vs Setpoint">
            <TempChart rows={filteredRows} floors={activeFloors} />
          </ChartCard>
          <ChartCard title="Humidity">
            <HumidityChart rows={filteredRows} floors={activeFloors} />
          </ChartCard>
          <ChartCard title="Lead Minutes">
            <LeadMinutesChart rows={filteredRows} floors={activeFloors} />
          </ChartCard>
          <ChartCard title="Precon Activity">
            <PreconActivityChart rows={filteredRows} floors={activeFloors} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
