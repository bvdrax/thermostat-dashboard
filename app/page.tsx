"use client";

import { useEffect, useState, useCallback } from "react";
import { formatTimeOnly } from "@/lib/format";
import FloorCard from "@/components/FloorCard";
import SparklineChart from "@/components/SparklineChart";
import type { TelemetryRow } from "@/lib/types";
import { getLatestTelemetry, getTelemetry, hoursAgo } from "@/lib/api";
import { RefreshCw, Cloud } from "lucide-react";

export default function OverviewPage() {
  const [floor1, setFloor1] = useState<TelemetryRow | null>(null);
  const [floor2, setFloor2] = useState<TelemetryRow | null>(null);
  const [sparkRows, setSparkRows] = useState<TelemetryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [f1, f2, spark] = await Promise.all([
        getLatestTelemetry(1),
        getLatestTelemetry(2),
        getTelemetry({ from: hoursAgo(2), sort: "asc", limit: 500 }),
      ]);
      setFloor1(f1);
      setFloor2(f2);
      setSparkRows(spark);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const outdoor = floor1 ?? floor2;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Live Status</h1>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-slate-500 text-xs">
              Refreshed {formatTimeOnly(lastRefresh.toISOString())}
            </span>
          )}
          <button
            onClick={fetchData}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {outdoor &&
        (outdoor.outdoor_temp !== null ||
          outdoor.outdoor_humidity !== null) && (
          <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-sm">
            <Cloud className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400">Outdoor</span>
            {outdoor.outdoor_temp !== null && (
              <span className="font-mono text-slate-200">
                {outdoor.outdoor_temp.toFixed(1)}°F
              </span>
            )}
            {outdoor.outdoor_humidity !== null && (
              <span className="text-slate-400">
                Humidity:{" "}
                <span className="font-mono text-slate-200">
                  {outdoor.outdoor_humidity.toFixed(0)}%
                </span>
              </span>
            )}
            {outdoor.wind_speed !== null && (
              <span className="text-slate-400">
                Wind:{" "}
                <span className="font-mono text-slate-200">
                  {outdoor.wind_speed.toFixed(0)} mph
                </span>
              </span>
            )}
          </div>
        )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((f) => (
            <div
              key={f}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-pulse min-h-[220px]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloorCard floor={1} data={floor1} />
          <FloorCard floor={2} data={floor2} />
        </div>
      )}

      {sparkRows.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">
            Last 2 hours — Temp vs Setpoint
          </p>
          <SparklineChart rows={sparkRows} />
        </div>
      )}
    </div>
  );
}
