import type * as React from "react";
import type { JSX } from "react";

export type GenericDataGridColumn<T> = {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  render: (row: T, rowIndex: number) => React.ReactNode;
  sortFn?: (a: T, b: T) => number;
};

export type DataGridProps<T> = {
  columns: GenericDataGridColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  selectionMode?: "single" | "multiselect" | "none";
  className?: string;
  style?: React.CSSProperties;
  // Optionally expose callbacks, loading, pagination, etc here
};

export type DataGridComponent = <T>(props: DataGridProps<T>) => JSX.Element;
