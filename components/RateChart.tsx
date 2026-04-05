"use client";

import { formatTime } from "@/lib/format";

import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { RateHistoryRow } from "@/lib/types";
import { useMemo } from "react";

interface RateChartProps {
  rows: RateHistoryRow[];
  floors: (1 | 2)[];
}

export default function RateChart({ rows, floors }: RateChartProps) {
  const data = useMemo(() => {
    const map = new Map<string, Record<string, number | null>>();
    rows.forEach((r) => {
      const key = r.recorded_at;
      if (!map.has(key)) map.set(key, { time: key as unknown as number });
      const entry = map.get(key)!;
      if (floors.includes(r.floor)) {
        entry[`heat${r.floor}`] = r.heat_rate;
        entry[`cool${r.floor}`] = r.cool_rate;
        entry[`outTemp`] = r.outdoor_temp;
      }
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.time as unknown as string).getTime() -
        new Date(b.time as unknown as string).getTime()
    );
  }, [rows, floors]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 4, right: 40, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis
          dataKey="time"
          tickFormatter={formatTime}
          tick={{ fill: "#64748b", fontSize: 11 }}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="rate"
          domain={["auto", "auto"]}
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={46}
          unit="°/m"
        />
        <YAxis
          yAxisId="temp"
          orientation="right"
          domain={["auto", "auto"]}
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
          unit="°F"
        />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "6px",
            color: "#f1f5f9",
            fontSize: 12,
          }}
          labelFormatter={(label: unknown) => formatTime(String(label))}
          formatter={(val: unknown, name: unknown) => {
            if (String(name) === "time") return null;
            return [
              String(name) === "Outdoor Temp"
                ? `${Number(val).toFixed(1)}°F`
                : `${Number(val).toFixed(4)}°/min`,
              String(name),
            ];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 4 }} />
        {floors.includes(1) && (
          <>
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="heat1"
              name="F1 Heat Rate"
              stroke="#f87171"
              dot={false}
              strokeWidth={2}
              connectNulls
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="cool1"
              name="F1 Cool Rate"
              stroke="#38bdf8"
              dot={false}
              strokeWidth={2}
              connectNulls
            />
          </>
        )}
        {floors.includes(2) && (
          <>
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="heat2"
              name="F2 Heat Rate"
              stroke="#fbbf24"
              dot={false}
              strokeWidth={2}
              connectNulls
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="cool2"
              name="F2 Cool Rate"
              stroke="#818cf8"
              dot={false}
              strokeWidth={2}
              connectNulls
            />
          </>
        )}
        <Scatter
          yAxisId="temp"
          dataKey="outTemp"
          name="Outdoor Temp"
          fill="#475569"
          opacity={0.5}
          legendType="circle"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
