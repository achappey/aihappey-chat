import React from "react";
import { useDarkMode } from "usehooks-ts";
import { parseCsv } from "./helpers";
import { useTheme } from "aihappey-components";

import { PreviewErrorBoundary } from "./PreviewErrorBoundary";
import { useTranslation } from "aihappey-i18n";

/**
 * Generic **stable** default comparator for grid / table sorting.
 * - Nullish values (`null` | `undefined`) are always pushed to the end.
 * - Supports number, bigint, boolean, Date, and strings (locale & numeric aware).
 * - Gracefully rejects Symbol / Function / NaN without throwing.
 */
export function defaultSortFn<T extends Record<PropertyKey, unknown>>(
  columnKey: keyof T
) {
  // Intl.Collator is ~30–50 × faster than repeated localeCompare in Chrome
  const collator = new Intl.Collator(undefined, {
    sensitivity: "base",
    numeric: true, // "2" < "10"
  });

  // Capture original index once → guarantees stability even on pre-ES2020 engines
  let order = 0;
  const index = new WeakMap<T, number>();

  return (a: T, b: T): number => {
    if (!index.has(a)) index.set(a, order++);
    if (!index.has(b)) index.set(b, order++);

    const va = a[columnKey];
    const vb = b[columnKey];

    // 1. Nullish to the bottom
    if (va == null && vb == null) return index.get(a)! - index.get(b)!; // already stable
    if (va == null) return 1;
    if (vb == null) return -1;

    // 2. BigInt first: (must be tested before typeof === "number")
    if (typeof va === "bigint" && typeof vb === "bigint") {
      return Number(va - vb);
    }

    // 3. Pure numbers
    if (typeof va === "number" && typeof vb === "number") {
      if (Number.isNaN(va) && Number.isNaN(vb)) return 0;
      if (Number.isNaN(va)) return 1;
      if (Number.isNaN(vb)) return -1;
      return va - vb;
    }

    // 4. Numeric strings (" 42 ", "003", "-7.5e1")
    const vNumA = parseNumericString(va);
    const vNumB = parseNumericString(vb);
    if (vNumA !== null && vNumB !== null) {
      return vNumA - vNumB;
    }

    // 5. Booleans
    if (typeof va === "boolean" && typeof vb === "boolean") {
      return Number(va) - Number(vb);
    }

    // 6. ISO-like Date strings or actual Date objects
    const timeA = toTimeMs(va);
    const timeB = toTimeMs(vb);
    if (timeA !== null && timeB !== null) {
      return timeA - timeB;
    }

    // 7. Fallback to locale-aware string compare
    return collator.compare(String(va), String(vb));
  };
}

/* ---------- helpers ---------- */

const ISO_DATE_RX = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

function parseNumericString(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const n = Number(v.trim());
  return Number.isFinite(n) ? n : null;
}

function toTimeMs(v: unknown): number | null {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "string" && ISO_DATE_RX.test(v)) {
    const n = Date.parse(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export const CsvBlock = ({ csv }: { csv: string }) => {
  const { DataGrid, Button } = useTheme();
  const { t } = useTranslation();

  const data = React.useMemo(() => parseCsv(csv), [csv]);
  if (!data || data.length === 0) return <div>No CSV data found.</div>;

  const [header, ...rows] = data;

  // Make row objects for the DataGrid
  const rowObjects = rows.map((row, i) => {
    // If row is shorter, fill with empty strings
    const filled = [...row];
    while (filled.length < header.length) filled.push("");
    return header.reduce(
      (acc, col, colIdx) => ({ ...acc, [col]: filled[colIdx] }),
      { __rowIndex: i }
    );
  });

  // Columns for DataGrid
  const columns = header.map((col) => ({
    key: col,
    header: col,
    sortable: true,
    sortFn: defaultSortFn(col),
    render: (row: any) => (
      <PreviewErrorBoundary>{row[col] ?? ""}</PreviewErrorBoundary>
    ),
  }));

  // DataGrid expects rowKey function
  const rowKey = (row: any) => row.__rowIndex;

  const download = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const prefix = `${yy}${MM}${dd}`;

    const a = document.createElement("a");
    a.href = url;
    a.download = `${prefix}_${crypto.randomUUID()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: "100%", overflowX: "auto" }}>
      <Button variant="subtle" onClick={download} icon="download" />
      <DataGrid
        columns={columns}
        data={rowObjects}
        selectionMode="none"
        rowKey={rowKey}
      />
    </div>
  );
};
