"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";
import type { PreconEvent, PreconStats } from "@/lib/pid";

interface PreconAccuracyChartProps {
  events: PreconEvent[];
  stats: PreconStats;
}

export default function PreconAccuracyChart({
  events,
  stats,
}: PreconAccuracyChartProps) {
  const floor1 = events
    .filter((e) => e.floor === 1)
    .map((e) => ({ x: e.leadMinutes ?? 0, y: e.deltaAtTransition }));

  const floor2 = events
    .filter((e) => e.floor === 2)
    .map((e) => ({ x: e.leadMinutes ?? 0, y: e.deltaAtTransition }));

  const meanDir =
    Math.abs(stats.mean) < 0.5
      ? "on target"
      : stats.mean > 0
      ? `${stats.mean.toFixed(1)}°F short on average`
      : `${Math.abs(stats.mean).toFixed(1)}°F overshoot on average`;

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
        No precon events found in this window
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            type="number"
            dataKey="x"
            name="Lead minutes"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            unit=" min"
            label={{
              value: "Lead minutes assigned",
              position: "insideBottom",
              offset: -2,
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Delta at transition"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={46}
            unit="°F"
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "#475569" }}
            contentStyle={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "6px",
              color: "#f1f5f9",
              fontSize: 12,
            }}
            formatter={(val: unknown, name: unknown) => [
              String(name) === "Lead minutes"
                ? `${val} min`
                : `${Number(val).toFixed(2)}°F`,
              String(name),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }} />
          <ReferenceLine y={0} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "Exact", fill: "#22c55e", fontSize: 11 }} />
          <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="3 2" />
          <ReferenceLine y={-1} stroke="#f59e0b" strokeDasharray="3 2" />
          {floor1.length > 0 && (
            <Scatter name="Floor 1" data={floor1} fill="#f59e0b" opacity={0.8} />
          )}
          {floor2.length > 0 && (
            <Scatter name="Floor 2" data={floor2} fill="#38bdf8" opacity={0.8} />
          )}
        </ScatterChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">
            Precon events
          </p>
          <p className="font-mono text-white text-lg">{stats.count}</p>
        </div>
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">
            Within ±1°F
          </p>
          <p className="font-mono text-white text-lg">
            {stats.withinOne.toFixed(0)}%
          </p>
        </div>
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">
            Within ±2°F
          </p>
          <p className="font-mono text-white text-lg">
            {stats.withinTwo.toFixed(0)}%
          </p>
        </div>
      </div>

      <p className="text-slate-400 text-sm">
        Interpretation: Lead time is{" "}
        <span className="text-slate-200 font-medium">{meanDir}</span>
        {Math.abs(stats.mean) >= 0.5 && (
          <>
            {" "}
            — consider adjusting your schedule buffer by{" "}
            <span className="font-mono">
              {stats.mean > 0 ? "+" : ""}
              {stats.mean.toFixed(1)}
            </span>{" "}
            minutes.
          </>
        )}
      </p>
    </div>
  );
}
