"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import type { TelemetryRow } from "@/lib/types";
import { useMemo } from "react";

interface LeadMinutesChartProps {
  rows: TelemetryRow[];
  floors: (1 | 2)[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadMinutesChart({ rows, floors }: LeadMinutesChartProps) {
  const data = useMemo(() => {
    const map = new Map<string, Record<string, number | null>>();
    rows
      .filter((r) => r.lead_minutes !== null)
      .forEach((r) => {
        const key = r.recorded_at;
        if (!map.has(key)) map.set(key, { time: key as unknown as number });
        const entry = map.get(key)!;
        if (floors.includes(r.floor)) {
          entry[`lead${r.floor}`] = r.lead_minutes;
        }
      });
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.time as unknown as string).getTime() -
        new Date(b.time as unknown as string).getTime()
    );
  }, [rows, floors]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
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
          domain={["auto", "auto"]}
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
          unit=" min"
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
          formatter={(val: unknown, name: unknown) => [`${val} min`, String(name)]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 4 }} />
        <ReferenceLine y={0} stroke="#475569" />
        {floors.includes(1) && (
          <Line
            type="monotone"
            dataKey="lead1"
            name="F1 Lead"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        )}
        {floors.includes(2) && (
          <Line
            type="monotone"
            dataKey="lead2"
            name="F2 Lead"
            stroke="#38bdf8"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
