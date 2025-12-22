import * as React from "react";
import {
  DataGrid as FluentDatagrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  DataGridProps as FluentDataGridProps,
} from "@fluentui/react-components";
import { GenericDataGridColumn } from "aihappey-types";

export interface GenericDataGridProps<T> {
  columns: GenericDataGridColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  selectionMode?: "single" | "multiselect" | "none";
  className?: string;
  style?: React.CSSProperties;
}

function mapColumnsToFluent<T>(
  columns: GenericDataGridColumn<T>[]
): TableColumnDefinition<T>[] {
  return columns.map((col) =>
    createTableColumn<T>({
      columnId: col.key,
      compare: col.sortFn ?? undefined,
      renderHeaderCell: () => col.header,
      renderCell: (item) => col.render(item, null!),
    })
  );
}

// Wrapper component with sort state!
export function DataGrid<T>({
  columns,
  data,
  rowKey,
  selectionMode = "none",
  className,
  style,
}: GenericDataGridProps<T>) {
  const fluentColumns = React.useMemo(
    () => mapColumnsToFluent(columns),
    [columns]
  );

  // 🟢 ADD sort state
  const [sortState, setSortState] = React.useState<
    FluentDataGridProps["sortState"]
  >({
    sortColumn: columns[0]?.key, // Default to first column
    sortDirection: "ascending",
  });

  // 🟢 Compute sorted data
  const sortedData = React.useMemo(() => {
    if (!sortState?.sortColumn) return data;
    const col = columns.find((c) => c.key === sortState.sortColumn);
    if (!col || !col.sortFn) return data;
    const sorted = [...data].sort(col.sortFn);
    return sortState.sortDirection === "ascending" ? sorted : sorted.reverse();
  }, [data, columns, sortState]);

  // 🟢 Handler for sort change
  const handleSortChange: FluentDataGridProps["onSortChange"] = (
    e,
    nextSortState
  ) => {
    setSortState(nextSortState);
  };

  return (
    <FluentDatagrid
      items={sortedData}
      columns={fluentColumns}
      sortState={sortState}
      onSortChange={handleSortChange}
      getRowId={rowKey}
      style={style}
      sortable
      size="extra-small"
      className={className}
    >
      <DataGridHeader>
        <DataGridRow
          selectionCell={
            selectionMode === "multiselect"
              ? { checkboxIndicator: { "aria-label": "Select all rows" } }
              : undefined
          }
        >
          {({ renderHeaderCell }) => (
            <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
          )}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<T>>
        {({ item, rowId }) => (
          <DataGridRow<T>
            key={rowId}
            selectionCell={
              selectionMode === "multiselect"
                ? { checkboxIndicator: { "aria-label": "Select row" } }
                : undefined
            }
          >
            {({ renderCell }) => (
              <DataGridCell
                style={{ whiteSpace: "normal", wordBreak: "break-word" }}
              >
                {renderCell(item)}
              </DataGridCell>
            )}
          </DataGridRow>
        )}
      </DataGridBody>
    </FluentDatagrid>
  );
}
