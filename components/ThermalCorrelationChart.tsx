"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import type { RateHistoryRow } from "@/lib/types";
import { useMemo } from "react";

interface ThermalCorrelationChartProps {
  rows: RateHistoryRow[];
  floors: (1 | 2)[];
}

export default function ThermalCorrelationChart({
  rows,
  floors,
}: ThermalCorrelationChartProps) {
  const { heatData, coolData, outdoorRange } = useMemo(() => {
    const filtered = rows.filter((r) => r.outdoor_temp !== null);

    const heatData: Record<string, { x: number; y: number }[]> = {
      f1: [],
      f2: [],
    };
    const coolData: Record<string, { x: number; y: number }[]> = {
      f1: [],
      f2: [],
    };

    filtered.forEach((r) => {
      const key = `f${r.floor}`;
      const ot = r.outdoor_temp as number;
      if (floors.includes(r.floor)) {
        if (r.heat_rate > 0) heatData[key].push({ x: ot, y: r.heat_rate });
        if (r.cool_rate > 0) coolData[key].push({ x: ot, y: r.cool_rate });
      }
    });

    const allTemps = filtered.map((r) => r.outdoor_temp as number);
    const outdoorRange =
      allTemps.length > 0
        ? { min: Math.min(...allTemps), max: Math.max(...allTemps) }
        : null;

    return { heatData, coolData, outdoorRange };
  }, [rows, floors]);

  const hasData =
    (floors.includes(1) &&
      (heatData.f1.length > 0 || coolData.f1.length > 0)) ||
    (floors.includes(2) &&
      (heatData.f2.length > 0 || coolData.f2.length > 0));

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
        No correlation data in this window
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-slate-500 text-xs">
        Each point is one rate_history sample. Downward slope on heat rate and
        upward slope on cool rate indicate the outdoor_factor is working
        correctly — harder to heat when colder outside, harder to cool when
        hotter.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 8, right: 8, bottom: 20, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            type="number"
            dataKey="x"
            name="Outdoor temp"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            unit="°F"
            domain={
              outdoorRange
                ? [
                    Math.floor(outdoorRange.min - 2),
                    Math.ceil(outdoorRange.max + 2),
                  ]
                : ["auto", "auto"]
            }
            label={{
              value: "Outdoor Temperature (°F)",
              position: "insideBottom",
              offset: -12,
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Rate"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
            unit="°/m"
            label={{
              value: "Rate (°F/min)",
              angle: -90,
              position: "insideLeft",
              offset: 12,
              fill: "#64748b",
              fontSize: 11,
            }}
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
              String(name) === "Outdoor temp"
                ? `${Number(val).toFixed(1)}°F`
                : `${Number(val).toFixed(4)}°F/min`,
              String(name),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }}
          />
          <ReferenceLine x={32} stroke="#475569" strokeDasharray="3 2" />
          {floors.includes(1) && heatData.f1.length > 0 && (
            <Scatter
              name="F1 Heat rate"
              data={heatData.f1}
              fill="#f87171"
              opacity={0.75}
              shape="circle"
            />
          )}
          {floors.includes(1) && coolData.f1.length > 0 && (
            <Scatter
              name="F1 Cool rate"
              data={coolData.f1}
              fill="#38bdf8"
              opacity={0.75}
              shape="circle"
            />
          )}
          {floors.includes(2) && heatData.f2.length > 0 && (
            <Scatter
              name="F2 Heat rate"
              data={heatData.f2}
              fill="#fbbf24"
              opacity={0.75}
              shape="diamond"
            />
          )}
          {floors.includes(2) && coolData.f2.length > 0 && (
            <Scatter
              name="F2 Cool rate"
              data={coolData.f2}
              fill="#818cf8"
              opacity={0.75}
              shape="diamond"
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
