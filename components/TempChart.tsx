"use client";

import { formatTime } from "@/lib/format";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";
import type { TelemetryRow } from "@/lib/types";
import { useMemo } from "react";

interface TempChartProps {
  rows: TelemetryRow[];
  floors: (1 | 2)[];
}

export default function TempChart({ rows, floors }: TempChartProps) {
  const data = useMemo(() => {
    const map = new Map<string, Record<string, number | null>>();
    rows.forEach((r) => {
      const key = r.recorded_at;
      if (!map.has(key)) map.set(key, { time: key as unknown as number });
      const entry = map.get(key)!;
      if (floors.includes(r.floor)) {
        entry[`temp${r.floor}`] = r.current_temp;
        entry[`sp${r.floor}`] = r.setpoint;
        entry[`outdoor`] = r.outdoor_temp;
      }
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.time as unknown as string).getTime() -
        new Date(b.time as unknown as string).getTime()
    );
  }, [rows, floors]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
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
          width={36}
          unit="°"
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
          formatter={(val: unknown, name: unknown) => [
            `${Number(val).toFixed(1)}°F`,
            String(name),
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 4 }} />
        <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
        {floors.includes(1) && (
          <>
            <Line
              type="monotone"
              dataKey="temp1"
              name="F1 Temp"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={2}
              connectNulls
            />
            <Line
              type="step"
              dataKey="sp1"
              name="F1 Setpoint"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={1}
              strokeDasharray="5 3"
              connectNulls
            />
          </>
        )}
        {floors.includes(2) && (
          <>
            <Line
              type="monotone"
              dataKey="temp2"
              name="F2 Temp"
              stroke="#38bdf8"
              dot={false}
              strokeWidth={2}
              connectNulls
            />
            <Line
              type="step"
              dataKey="sp2"
              name="F2 Setpoint"
              stroke="#38bdf8"
              dot={false}
              strokeWidth={1}
              strokeDasharray="5 3"
              connectNulls
            />
          </>
        )}
        <Line
          type="monotone"
          dataKey="outdoor"
          name="Outdoor"
          stroke="#64748b"
          dot={false}
          strokeWidth={1}
          strokeDasharray="3 2"
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
