import { Table as MuiTable, TableContainer, Paper } from "@mui/material";

export const Table = ({ striped, bordered, hover, children, className }: any) => (
  <TableContainer component={Paper} variant={bordered ? "outlined" : "elevation"} className={className}>
    <MuiTable size="small" sx={striped ? { "tbody tr:nth-of-type(odd)": { backgroundColor: "action.hover" } } : undefined}>{children}</MuiTable>
  </TableContainer>
);

