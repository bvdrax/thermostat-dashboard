"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import SetpointLog from "@/components/SetpointLog";
import type { SetpointChangeRow } from "@/lib/types";
import { getSetpointChangesPage } from "@/lib/api";

type FloorSel = "all" | "1" | "2";
type ReasonSel =
  | "all"
  | "schedule_day"
  | "schedule_night"
  | "precon"
  | "manual_override";

const PAGE_SIZE = 50;

export default function SetpointsPage() {
  const [floorSel, setFloorSel] = useState<FloorSel>("all");
  const [reasonSel, setReasonSel] = useState<ReasonSel>("all");
  const [rows, setRows] = useState<SetpointChangeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // cursor stack: index 0 = first page (no cursor), index N = after_id for page N+1
  const cursors = useRef<Array<number | undefined>>([undefined]);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const cursor = cursors.current[pageNum - 1];
        const result = await getSetpointChangesPage({
          floor:
            floorSel === "all" ? "all" : (Number(floorSel) as 1 | 2),
          sort: "desc",
          limit: PAGE_SIZE,
          after_id: cursor,
        });

        // Filter by reason client-side (sidecar may not support reason filter)
        const filtered =
          reasonSel === "all"
            ? result.data
            : result.data.filter((r) => r.reason === reasonSel);

        setRows(filtered);
        setHasMore(result.has_more);

        // Store next cursor
        if (result.next_cursor !== null) {
          cursors.current[pageNum] = result.next_cursor;
        }
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [floorSel, reasonSel]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    cursors.current = [undefined];
    setPage(1);
  }, [floorSel, reasonSel]);

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  const reasonCounts = rows.reduce<Record<string, number>>((acc, r) => {
    const key = r.reason ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">Setpoint Audit Log</h1>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
            {(["all", "1", "2"] as FloorSel[]).map((f) => (
              <button
                key={f}
                onClick={() => setFloorSel(f)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  floorSel === f
                    ? "bg-slate-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f === "all" ? "All Floors" : `Floor ${f}`}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1 flex-wrap">
            {(
              [
                "all",
                "schedule_day",
                "schedule_night",
                "precon",
                "manual_override",
              ] as ReasonSel[]
            ).map((r) => (
              <button
                key={r}
                onClick={() => setReasonSel(r)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  reasonSel === r
                    ? "bg-slate-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r === "all"
                  ? "All Reasons"
                  : r === "schedule_day"
                  ? "Day"
                  : r === "schedule_night"
                  ? "Night"
                  : r === "precon"
                  ? "Precon"
                  : "Manual"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <SetpointLog
        rows={rows}
        loading={loading}
        page={page}
        hasMore={hasMore}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        totalInView={rows.length}
        reasonCounts={reasonCounts}
      />
    </div>
  );
}
