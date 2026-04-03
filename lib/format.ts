const TZ = "America/Chicago";

// The sidecar appends Z to timestamps but the values are already in Central Time —
// the Z is incorrect metadata. Strip the timezone indicator so JS parses the
// value as local (Central) time rather than converting from UTC.
function stripTZ(iso: string): string {
  return iso.replace(/Z$/, "").replace(/[+-]\d{2}:\d{2}$/, "");
}

/** "Apr 2, 1:30 PM" — used for chart axis ticks and tooltips */
export function formatTime(iso: string): string {
  return new Date(stripTZ(iso)).toLocaleString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "1:30 PM" — used for compact time-only displays */
export function formatTimeOnly(iso: string): string {
  return new Date(stripTZ(iso)).toLocaleTimeString("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Full locale string with Central Time zone label */
export function formatDateTime(iso: string): string {
  return new Date(stripTZ(iso)).toLocaleString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
