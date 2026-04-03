"use client";

import { formatTimeOnly } from "@/lib/format";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TelemetryRow } from "@/lib/types";

interface SparklineChartProps {
  rows: TelemetryRow[];
}

export default function SparklineChart({ rows }: SparklineChartProps) {
  const data = rows.map((r) => ({
    time: formatTimeOnly(r.recorded_at),
    [`temp_f${r.floor}`]: r.current_temp,
    [`sp_f${r.floor}`]: r.setpoint,
  }));

  // merge rows by timestamp bucket
  const merged: Record<string, Record<string, number | null>> = {};
  rows.forEach((r) => {
    const key = formatTimeOnly(r.recorded_at);
    if (!merged[key]) merged[key] = { time: key as unknown as number };
    merged[key][`temp_f${r.floor}`] = r.current_temp;
    merged[key][`sp_f${r.floor}`] = r.setpoint;
  });

  void data;
  const chartData = Object.values(merged);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <XAxis
          dataKey="time"
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
        />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "6px",
            color: "#f1f5f9",
            fontSize: 12,
          }}
          labelStyle={{ color: "#94a3b8" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 4 }}
        />
        <Line
          type="monotone"
          dataKey="temp_f1"
          name="F1 Temp"
          stroke="#f59e0b"
          dot={false}
          strokeWidth={1.5}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="sp_f1"
          name="F1 Setpoint"
          stroke="#f59e0b"
          dot={false}
          strokeWidth={1}
          strokeDasharray="4 2"
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="temp_f2"
          name="F2 Temp"
          stroke="#38bdf8"
          dot={false}
          strokeWidth={1.5}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="sp_f2"
          name="F2 Setpoint"
          stroke="#38bdf8"
          dot={false}
          strokeWidth={1}
          strokeDasharray="4 2"
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
