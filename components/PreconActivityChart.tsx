"use client";

import { formatTime } from "@/lib/format";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { TelemetryRow } from "@/lib/types";
import { useMemo } from "react";

interface PreconActivityChartProps {
  rows: TelemetryRow[];
  floors: (1 | 2)[];
}

export default function PreconActivityChart({
  rows,
  floors,
}: PreconActivityChartProps) {
  const data = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    rows
      .filter((r) => r.precon_active === 1)
      .forEach((r) => {
        const key = r.recorded_at;
        if (!map.has(key)) map.set(key, { time: key as unknown as number });
        const entry = map.get(key)!;
        if (floors.includes(r.floor)) {
          entry[`precon${r.floor}`] = 1;
        }
      });
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.time as unknown as string).getTime() -
        new Date(b.time as unknown as string).getTime()
    );
  }, [rows, floors]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
        No precon events in this window
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis
          dataKey="time"
          tickFormatter={formatTime}
          tick={{ fill: "#64748b", fontSize: 11 }}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
        />
        <YAxis hide domain={[0, 1]} />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "6px",
            color: "#f1f5f9",
            fontSize: 12,
          }}
          labelFormatter={(label: unknown) => formatTime(String(label))}
          formatter={(_val: unknown, name: unknown) => ["Active", String(name)]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 4 }} />
        {floors.includes(1) && (
          <Bar dataKey="precon1" name="F1 Precon" fill="#a78bfa" opacity={0.8} />
        )}
        {floors.includes(2) && (
          <Bar dataKey="precon2" name="F2 Precon" fill="#818cf8" opacity={0.8} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
