"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Thermometer } from "lucide-react";

const links = [
  { href: "/", label: "Overview" },
  { href: "/history", label: "History" },
  { href: "/rates", label: "Rates" },
  { href: "/setpoints", label: "Setpoints" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-semibold text-lg shrink-0"
        >
          <Thermometer className="w-5 h-5 text-amber-400" />
          <span>Thermostat</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
