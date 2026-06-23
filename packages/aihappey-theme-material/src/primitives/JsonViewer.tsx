import * as React from "react";
import { Box, Paper, Typography } from "@mui/material";

function parseJsonValue(input: unknown): { ok: true; value: any } | { ok: false } {
  if (input !== undefined && (typeof input === "object" || typeof input === "number" || typeof input === "boolean")) return { ok: true, value: input };
  let current = String(input ?? "");
  if (!current.trim()) return { ok: false };
  for (let i = 0; i < 3; i += 1) {
    try {
      const parsed = JSON.parse(current);
      if (typeof parsed === "string" && /^[\s\r\n]*[\[{]/.test(parsed) && parsed !== current) {
        current = parsed;
        continue;
      }
      return { ok: true, value: parsed };
    } catch {
      return { ok: false };
    }
  }
  return { ok: true, value: current };
}

const JsonValue = ({ value, label }: { value: any; label?: React.ReactNode }) => {
  if (typeof value === "object" && value !== null) {
    const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value);
    return <Box component="details" open><Box component="summary" sx={{ cursor: "pointer" }}>{label ? <strong>{label}: </strong> : null}<Typography component="span" variant="caption" color="text.secondary">{Array.isArray(value) ? `[Array] (${value.length} items)` : "{Object}"}</Typography></Box><Box component="ul" sx={{ m: "4px 0 4px 18px", pl: 2 }}>{entries.map(([key, child]) => <li key={key}><JsonValue value={child} label={key} /></li>)}</Box></Box>;
  }
  return <span>{label ? <strong>{label}: </strong> : null}<Typography component="span" variant="caption" color={typeof value === "string" ? "primary" : typeof value === "number" ? "secondary" : "text.secondary"}>{JSON.stringify(value)}</Typography></span>;
};

export const JsonViewer = ({ value, data, title, className, style }: any) => {
  const parsed = parseJsonValue(value ?? data);
  if (!parsed.ok) return <Typography color="error" className={className} sx={style}>Invalid JSON</Typography>;
  return <Paper variant="outlined" className={className} sx={{ p: 1.5, overflowX: "auto", ...style }}>{title ? <Typography variant="subtitle2" sx={{ mb: 1 }}>{title}</Typography> : null}<Box sx={{ fontFamily: "monospace", fontSize: 13, lineHeight: 1.6 }}><JsonValue value={parsed.value} /></Box></Paper>;
};

