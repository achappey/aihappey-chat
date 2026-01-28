export function formatTimestamp(ts?: string | number) {
  if (ts == null) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  // Keep it compact; user locale.
  return d.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

