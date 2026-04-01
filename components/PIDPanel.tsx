"use client";

import { useState } from "react";
import type { PIDSuggestion } from "@/lib/pid";
import { ChevronDown, ChevronRight, Info } from "lucide-react";

interface PIDPanelProps {
  suggestions: PIDSuggestion[];
}

function fmt(n: number, decimals = 4) {
  return n.toFixed(decimals);
}

const COL_KEYS: Array<{ floor: 1 | 2; mode: "heat" | "cool" }> = [
  { floor: 1, mode: "heat" },
  { floor: 1, mode: "cool" },
  { floor: 2, mode: "heat" },
  { floor: 2, mode: "cool" },
];

export default function PIDPanel({ suggestions }: PIDPanelProps) {
  const [open, setOpen] = useState(false);

  function get(floor: 1 | 2, mode: "heat" | "cool") {
    return suggestions.find((s) => s.floor === floor && s.mode === mode);
  }

  const rows: Array<{
    label: string;
    render: (s: PIDSuggestion | undefined) => string;
  }> = [
    {
      label: "Learned rate (°F/min)",
      render: (s) => (s ? fmt(s.learnedRate) : "—"),
    },
    {
      label: "Outdoor factor",
      render: (s) => (s ? fmt(s.outdoorFactor, 3) : "—"),
    },
    {
      label: "Kp suggestion",
      render: (s) => (s ? fmt(s.kp) : "—"),
    },
    {
      label: "Ti suggestion (min)",
      render: (s) => (s ? fmt(s.ti, 2) : "—"),
    },
    {
      label: "Td suggestion (min)",
      render: (s) => (s ? fmt(s.td, 2) : "—"),
    },
    {
      label: "Suggested deadband (°F)",
      render: (s) => (s ? fmt(s.deadband, 2) : "—"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 bg-amber-900/20 border border-amber-700/40 rounded-lg px-4 py-3">
        <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-amber-200 text-sm">
          These are <strong>suggested gains based on plant characterisation</strong>,
          not active control values. The system uses on/off bang-bang control.
          Use these numbers as a reference if migrating to a PID controller.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left py-2 pr-4 font-medium">Parameter</th>
              {COL_KEYS.map(({ floor, mode }) => (
                <th
                  key={`${floor}-${mode}`}
                  className={`text-right py-2 px-3 font-medium ${
                    mode === "heat" ? "text-amber-400" : "text-sky-400"
                  }`}
                >
                  F{floor} {mode === "heat" ? "Heat" : "Cool"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, render }) => (
              <tr
                key={label}
                className="border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors"
              >
                <td className="py-2.5 pr-4 text-slate-300">{label}</td>
                {COL_KEYS.map(({ floor, mode }) => (
                  <td
                    key={`${floor}-${mode}`}
                    className="py-2.5 px-3 text-right font-mono text-slate-200"
                  >
                    {render(get(floor, mode))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors self-start"
      >
        {open ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        How are these calculated?
      </button>

      {open && (
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 text-sm text-slate-300 space-y-2">
          <p>
            <strong className="text-white">Learned rate</strong> — exponential
            moving average of heat_rate or cool_rate from the rate_history
            table. Units: °F per minute of HVAC runtime.
          </p>
          <p>
            <strong className="text-white">Outdoor factor</strong> — EMA of the
            outdoor_factor column, which captures how much outdoor temperature
            shifts the effective rate.
          </p>
          <p>
            <strong className="text-white">Kp</strong> ={" "}
            <code className="bg-slate-700 px-1 rounded">
              learnedRate × outdoorFactor
            </code>{" "}
            — process gain: approximate °F change per unit of effort per minute.
          </p>
          <p>
            <strong className="text-white">Ti</strong> ={" "}
            <code className="bg-slate-700 px-1 rounded">1 / Kp</code> —
            integral time in minutes; how long to correct a 1° offset.
          </p>
          <p>
            <strong className="text-white">Td</strong> ={" "}
            <code className="bg-slate-700 px-1 rounded">Ti / 4</code> —
            derivative time, conservative Ziegler-Nichols starting point.
          </p>
          <p>
            <strong className="text-white">Suggested deadband</strong> ={" "}
            <code className="bg-slate-700 px-1 rounded">learnedRate × 5</code>{" "}
            — minimum ±°F tolerance to avoid short-cycling (5 minutes of drift).
          </p>
        </div>
      )}
    </div>
  );
}
