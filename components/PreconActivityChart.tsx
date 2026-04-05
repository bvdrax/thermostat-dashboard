"use client";

import { formatTime } from "@/lib/format";
import type { PreconEvent } from "@/lib/pid";
import { useMemo } from "react";

interface PreconActivityChartProps {
  events: PreconEvent[];
  floors: (1 | 2)[];
}

const FLOOR_COLORS: Record<1 | 2, { bg: string; label: string }> = {
  1: { bg: "#a855f7", label: "F1 Precon" }, // vivid purple
  2: { bg: "#14b8a6", label: "F2 Precon" }, // teal
};

export default function PreconActivityChart({
  events,
  floors,
}: PreconActivityChartProps) {
  const filtered = useMemo(
    () => events.filter((e) => floors.includes(e.floor)),
    [events, floors]
  );

  const { minMs, maxMs } = useMemo(() => {
    if (filtered.length === 0) return { minMs: 0, maxMs: 1 };
    const starts = filtered.map((e) => new Date(e.startAt).getTime());
    const ends = filtered.map((e) => new Date(e.endAt).getTime());
    return {
      minMs: Math.min(...starts),
      maxMs: Math.max(...ends),
    };
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
        No precon events in this window
      </div>
    );
  }

  const span = maxMs - minMs || 1;

  function pct(iso: string) {
    return ((new Date(iso).getTime() - minMs) / span) * 100;
  }

  // Rows: one per floor that has events
  const activeFloors = floors.filter((f) =>
    filtered.some((e) => e.floor === f)
  );

  return (
    <div className="flex flex-col gap-3">
      {activeFloors.map((floor) => {
        const floorEvents = filtered.filter((e) => e.floor === floor);
        const color = FLOOR_COLORS[floor];
        return (
          <div key={floor} className="flex items-center gap-3">
            <span className="text-slate-400 text-xs w-14 shrink-0 text-right">
              Floor {floor}
            </span>
            <div className="relative flex-1 h-7 bg-slate-700/40 rounded overflow-hidden">
              {floorEvents.map((e, i) => {
                const left = pct(e.startAt);
                const right = pct(e.endAt);
                const width = Math.max(right - left, 0.3); // min 0.3% so tiny events are visible
                return (
                  <div
                    key={i}
                    title={`${formatTime(e.startAt)} → ${formatTime(e.endAt)}\nΔ ${e.deltaAtTransition.toFixed(1)}°F`}
                    className="absolute top-0.5 bottom-0.5 rounded-sm"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: color.bg,
                      opacity: 0.85,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Time axis */}
      <div className="flex items-center gap-3">
        <span className="w-14 shrink-0" />
        <div className="flex-1 flex justify-between text-slate-500 text-xs">
          <span>{formatTime(new Date(minMs).toISOString())}</span>
          <span>{formatTime(new Date(maxMs).toISOString())}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-400 pl-[4.5rem]">
        {activeFloors.map((floor) => (
          <span key={floor} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: FLOOR_COLORS[floor].bg }}
            />
            {FLOOR_COLORS[floor].label}
            <span className="text-slate-500">
              ({filtered.filter((e) => e.floor === floor).length} events)
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
