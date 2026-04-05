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

interface HvacBlock {
  action: "heating" | "cooling";
  startMs: number;
  endMs: number;
}

function computeHvacBlocks(rows: TelemetryRow[], floor: 1 | 2): HvacBlock[] {
  const floorRows = rows
    .filter((r) => r.floor === floor)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  const blocks: HvacBlock[] = [];
  let current: HvacBlock | null = null;

  for (const r of floorRows) {
    const action = r.hvac_action === "heating" ? "heating" : r.hvac_action === "cooling" ? "cooling" : null;
    const ms = new Date(r.recorded_at).getTime();
    if (action) {
      if (current && current.action === action) {
        current.endMs = ms;
      } else {
        if (current) blocks.push(current);
        current = { action, startMs: ms, endMs: ms };
      }
    } else {
      if (current) { blocks.push(current); current = null; }
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

const HVAC_COLORS = {
  heating: "#f97316", // orange
  cooling: "#38bdf8", // sky
};

function HvacStrip({ rows, floors }: { rows: TelemetryRow[]; floors: (1 | 2)[] }) {
  const { blocks, minMs, maxMs } = useMemo(() => {
    const allMs = rows.map((r) => new Date(r.recorded_at).getTime());
    const minMs = Math.min(...allMs);
    const maxMs = Math.max(...allMs);
    const blocks = floors.map((f) => ({ floor: f, blocks: computeHvacBlocks(rows, f) }));
    return { blocks, minMs, maxMs };
  }, [rows, floors]);

  const span = maxMs - minMs || 1;

  return (
    <div className="flex flex-col gap-1 mt-1 pl-5 pr-2">
      {blocks.map(({ floor, blocks: floorBlocks }) => (
        <div key={floor} className="flex items-center gap-2">
          <span className="text-slate-500 text-xs w-10 shrink-0 text-right">F{floor}</span>
          <div className="relative flex-1 h-4 bg-slate-700/30 rounded overflow-hidden">
            {floorBlocks.map((b, i) => {
              const left = ((b.startMs - minMs) / span) * 100;
              const width = Math.max(((b.endMs - b.startMs) / span) * 100, 0.3);
              return (
                <div
                  key={i}
                  title={`${formatTime(new Date(b.startMs).toISOString())} → ${formatTime(new Date(b.endMs).toISOString())}: ${b.action}`}
                  className="absolute top-0.5 bottom-0.5 rounded-sm"
                  style={{ left: `${left}%`, width: `${width}%`, backgroundColor: HVAC_COLORS[b.action], opacity: 0.75 }}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="w-10 shrink-0" />
        <div className="flex gap-4 text-xs text-slate-500 pl-0.5">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: HVAC_COLORS.heating }} />
            Heating
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: HVAC_COLORS.cooling }} />
            Cooling
          </span>
        </div>
      </div>
    </div>
  );
}

interface TempChartProps {
  rows: TelemetryRow[];
  floors: (1 | 2)[];
}

export default function TempChart({ rows, floors }: TempChartProps) {
  // `rows` is also passed to HvacStrip below for the HVAC activity timeline
  const data = useMemo(() => {
    const map = new Map<string, Record<string, number | null>>();
    rows.forEach((r) => {
      const key = r.recorded_at;
      if (!map.has(key)) map.set(key, { time: key as unknown as number });
      const entry = map.get(key)!;
      if (floors.includes(r.floor)) {
        entry[`temp${r.floor}`] = r.current_temp;
        entry[`sp${r.floor}`] = r.setpoint;
        entry[`action${r.floor}`] = r.hvac_action as unknown as number;
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
    <div>
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
          formatter={(val: unknown, name: unknown, item: unknown) => {
            const key = (item as { dataKey?: string })?.dataKey ?? "";
            // Suppress action keys from appearing as their own rows
            if (key.startsWith("action")) return null;
            const n = String(name);
            // Append HVAC action to the temp row label
            if (key.startsWith("temp")) {
              const floor = key.replace("temp", "");
              const payload = (item as { payload?: Record<string, unknown> })?.payload;
              const action = payload ? String(payload[`action${floor}`] ?? "idle") : "idle";
              const actionLabel = action === "heating" ? " 🔥" : action === "cooling" ? " ❄" : " —";
              return [`${Number(val).toFixed(1)}°F${actionLabel}`, n];
            }
            return [`${Number(val).toFixed(1)}°F`, n];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 4 }} />
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
        {/* Hidden lines to carry hvac_action in tooltip payload */}
        {floors.includes(1) && (
          <Line dataKey="action1" legendType="none" dot={false} stroke="none" strokeWidth={0} />
        )}
        {floors.includes(2) && (
          <Line dataKey="action2" legendType="none" dot={false} stroke="none" strokeWidth={0} />
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
    <HvacStrip rows={rows} floors={floors} />
    </div>
  );
}
