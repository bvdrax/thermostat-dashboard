"use client";

import { useEffect, useState, useCallback } from "react";
import RateChart from "@/components/RateChart";
import PIDPanel from "@/components/PIDPanel";
import PreconAccuracyChart from "@/components/PreconAccuracyChart";
import type { RateHistoryRow, TelemetryRow } from "@/lib/types";
import { getRateHistory, getTelemetry, daysAgo, hoursAgo } from "@/lib/api";
import {
  computeAllSuggestions,
  detectPreconEvents,
  computePreconStats,
} from "@/lib/pid";
import type { PIDSuggestion, PreconEvent, PreconStats } from "@/lib/pid";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <h2 className="text-slate-200 font-semibold text-base mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function RatesPage() {
  const [range, setRange] = useState<Range>("7d");
  const [floorSel, setFloorSel] = useState<FloorSel>("both");
  const [rateRows, setRateRows] = useState<RateHistoryRow[]>([]);
  const [telemetryRows, setTelemetryRows] = useState<TelemetryRow[]>([]);
  const [suggestions, setSuggestions] = useState<PIDSuggestion[]>([]);
  const [preconEvents, setPreconEvents] = useState<PreconEvent[]>([]);
  const [preconStats, setPreconStats] = useState<PreconStats>({
    mean: 0,
    withinOne: 0,
    withinTwo: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rates, telem] = await Promise.all([
        getRateHistory({ from: fromForRange(range), sort: "asc", limit: 500 }),
        getTelemetry({ from: fromForRange(range), sort: "asc", limit: 1000 }),
      ]);
      setRateRows(rates);
      setTelemetryRows(telem);
      setSuggestions(computeAllSuggestions(rates));
      const events = detectPreconEvents(telem);
      setPreconEvents(events);
      setPreconStats(computePreconStats(events));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  void telemetryRows;

  const activeFloors: (1 | 2)[] =
    floorSel === "both" ? [1, 2] : floorSel === "1" ? [1] : [2];

  const filteredRates = rateRows.filter((r) =>
    floorSel === "both" ? true : r.floor === Number(floorSel)
  );

  const filteredPreconEvents = preconEvents.filter((e) =>
    floorSel === "both" ? true : e.floor === Number(floorSel)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">Rate History &amp; PID Analysis</h1>
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
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 h-72 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Section title="Learned Rate History">
            <RateChart rows={filteredRates} floors={activeFloors} />
          </Section>

          <Section title="PID Gain Suggestions">
            <PIDPanel suggestions={suggestions} />
          </Section>

          <Section title="Precon Accuracy">
            <PreconAccuracyChart
              events={filteredPreconEvents}
              stats={computePreconStats(filteredPreconEvents)}
            />
          </Section>
        </div>
      )}
    </div>
  );
}
