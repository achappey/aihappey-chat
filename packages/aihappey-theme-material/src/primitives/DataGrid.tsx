import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import type { DataGridProps } from "aihappey-types";

export function DataGrid<T>({ columns, data, rowKey, className, style }: DataGridProps<T>) {
  return (
    <TableContainer component={Paper} variant="outlined" className={className} style={style}>
      <Table size="small">
        <TableHead><TableRow>{columns.map((column) => <TableCell key={column.key} style={{ width: column.width }}>{column.header}</TableCell>)}</TableRow></TableHead>
        <TableBody>{data.map((row, rowIndex) => <TableRow hover key={rowKey(row)}>{columns.map((column) => <TableCell key={column.key}>{column.render(row, rowIndex)}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
    </TableContainer>
  );
}

