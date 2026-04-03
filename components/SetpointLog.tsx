"use client";

import type { SetpointChangeRow } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

interface SetpointLogProps {
  rows: SetpointChangeRow[];
  loading: boolean;
  page: number;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
  totalInView: number;
  reasonCounts: Record<string, number>;
}

const REASON_STYLES: Record<string, string> = {
  schedule_day: "bg-green-400/20 text-green-300 border border-green-400/30",
  schedule_afternoon: "bg-amber-400/20 text-amber-300 border border-amber-400/30",
  schedule_night: "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  precon: "bg-violet-400/20 text-violet-300 border border-violet-400/30",
  manual_override: "bg-orange-400/20 text-orange-300 border border-orange-400/30",
};

const REASON_LABELS: Record<string, string> = {
  schedule_day: "Schedule Day",
  schedule_afternoon: "Schedule Afternoon",
  schedule_night: "Schedule Night",
  precon: "Precon",
  manual_override: "Manual Override",
};

function ReasonBadge({ reason }: { reason: SetpointChangeRow["reason"] }) {
  if (!reason) return <span className="text-slate-500">—</span>;
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        REASON_STYLES[reason] ?? "bg-slate-600/40 text-slate-400"
      }`}
    >
      {REASON_LABELS[reason] ?? reason}
    </span>
  );
}

export default function SetpointLog({
  rows,
  loading,
  page,
  hasMore,
  onPrev,
  onNext,
  totalInView,
  reasonCounts,
}: SetpointLogProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="text-slate-400">
          <span className="font-mono text-white">{totalInView}</span> changes in view
        </span>
        {Object.entries(reasonCounts).map(([reason, count]) => (
          <span key={reason} className="flex items-center gap-1.5">
            <ReasonBadge reason={reason as SetpointChangeRow["reason"]} />
            <span className="font-mono text-slate-300">{count}</span>
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr className="text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left py-3 px-4 font-medium">Timestamp</th>
              <th className="text-left py-3 px-4 font-medium">Floor</th>
              <th className="text-right py-3 px-4 font-medium">Previous</th>
              <th className="text-right py-3 px-4 font-medium">New</th>
              <th className="text-left py-3 px-4 font-medium">Mode</th>
              <th className="text-left py-3 px-4 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="py-3 px-4">
                      <div className="h-4 bg-slate-700 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-slate-500"
                >
                  No setpoint changes found
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-700/20 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-slate-300 text-xs whitespace-nowrap">
                    {formatDateTime(row.changed_at)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">Floor {row.floor}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                    {row.previous_setpoint !== null
                      ? `${row.previous_setpoint.toFixed(1)}°F`
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-200 font-semibold">
                    {row.new_setpoint.toFixed(1)}°F
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        row.hvac_mode === "heat"
                          ? "bg-amber-400/20 text-amber-300"
                          : "bg-sky-400/20 text-sky-300"
                      }`}
                    >
                      {row.hvac_mode === "heat" ? "Heat" : "Cool"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <ReasonBadge reason={row.reason} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Page {page}</span>
        <div className="flex gap-2">
          <button
            onClick={onPrev}
            disabled={page === 1}
            className="px-3 py-1.5 rounded bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600 transition-colors text-sm"
          >
            Prev
          </button>
          <button
            onClick={onNext}
            disabled={!hasMore}
            className="px-3 py-1.5 rounded bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600 transition-colors text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
