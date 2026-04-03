"use client";

import { useEffect, useState } from "react";
import RateChart from "@/components/RateChart";
import ThermalCorrelationChart from "@/components/ThermalCorrelationChart";
import LeadTimeEstimator from "@/components/LeadTimeEstimator";
import PreconAccuracyChart from "@/components/PreconAccuracyChart";
import type { RateHistoryRow, TelemetryRow, StateRow } from "@/lib/types";
import {
  getRateHistory,
  getTelemetry,
  getLatestTelemetry,
  getState,
  daysAgo,
  hoursAgo,
} from "@/lib/api";
import {
  computeAllThermalParams,
  detectPreconEvents,
  computePreconStats,
} from "@/lib/pid";
import type { ThermalParams, PreconEvent, PreconStats } from "@/lib/pid";

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
    case "6h":  return hoursAgo(6);
    case "24h": return hoursAgo(24);
    case "7d":  return daysAgo(7);
    case "30d": return daysAgo(30);
  }
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="mb-4">
        <h2 className="text-slate-200 font-semibold text-base">{title}</h2>
        {subtitle && (
          <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function ThermalPage() {
  const [range, setRange] = useState<Range>("7d");
  const [floorSel, setFloorSel] = useState<FloorSel>("both");

  const [rateRows, setRateRows] = useState<RateHistoryRow[]>([]);
  const [telemetryRows, setTelemetryRows] = useState<TelemetryRow[]>([]);
  const [thermalParams, setThermalParams] = useState<ThermalParams[]>([]);
  const [preconEvents, setPreconEvents] = useState<PreconEvent[]>([]);
  const [preconStats, setPreconStats] = useState<PreconStats>({
    mean: 0, withinOne: 0, withinTwo: 0, count: 0,
  });
  const [latestF1, setLatestF1] = useState<TelemetryRow | null>(null);
  const [latestF2, setLatestF2] = useState<TelemetryRow | null>(null);
  const [stateF1, setStateF1] = useState<StateRow | null>(null);
  const [stateF2, setStateF2] = useState<StateRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [rates, telem, f1, f2, s1, s2] = await Promise.all([
          getRateHistory({ from: fromForRange(range), sort: "asc", limit: 500 }),
          getTelemetry({ from: fromForRange(range), sort: "asc", limit: 1000 }),
          getLatestTelemetry(1),
          getLatestTelemetry(2),
          getState(1),
          getState(2),
        ]);
        if (cancelled) return;
        setRateRows(rates);
        setTelemetryRows(telem);
        // Override learnedRate with the freshest values from /state (cycle-complete accuracy)
        // but keep outdoorFactor from rate_history for environmental adjustment.
        const baseParams = computeAllThermalParams(rates);
        const mergedParams = baseParams.map((p) => {
          const s = p.floor === 1 ? s1 : s2;
          return s
            ? { ...p, learnedRate: p.mode === "heat" ? s.heat_rate : s.cool_rate }
            : p;
        });
        setThermalParams(mergedParams);
        const events = detectPreconEvents(telem);
        setPreconEvents(events);
        setPreconStats(computePreconStats(events));
        setLatestF1(f1);
        setLatestF2(f2);
        setStateF1(s1);
        setStateF2(s2);
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

  const filteredRates = rateRows.filter((r) =>
    floorSel === "both" ? true : r.floor === Number(floorSel)
  );

  const filteredPreconEvents = preconEvents.filter((e) =>
    floorSel === "both" ? true : e.floor === Number(floorSel)
  );

  void telemetryRows;
  void stateF1;
  void stateF2;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Thermal Characterisation
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            How this building heats and cools — and what that means for precon lead times
          </p>
        </div>
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
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 h-64 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Section
            title="Learned Rate History"
            subtitle="Heat and cool rates over time with outdoor temperature overlay"
          >
            <RateChart rows={filteredRates} floors={activeFloors} />
          </Section>

          <Section
            title="Outdoor Temperature Correlation"
            subtitle="Rate vs outdoor temp — shows how environment drives heating and cooling speed"
          >
            <ThermalCorrelationChart rows={filteredRates} floors={activeFloors} />
          </Section>

          <Section
            title="Lead Time Estimator"
            subtitle="Computed lead time based on current conditions and learned rates"
          >
            <LeadTimeEstimator
              floor1={latestF1}
              floor2={latestF2}
              params={thermalParams}
            />
          </Section>

          <Section
            title="Precon Accuracy"
            subtitle="How closely assigned lead times matched actual thermal performance"
          >
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
