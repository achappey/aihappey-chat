import Table from 'react-bootstrap/Table';
import React from 'react';
import { GenericDataGridColumn } from 'aihappey-types';

export function DataGrid<T>({
  columns,
  data,
  rowKey,
  className,
  style,
}: {
  columns: GenericDataGridColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Table striped bordered hover className={className} style={style}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={rowKey(row)}>
            {columns.map((col) => (
              <td key={col.key}>{col.render(row, i)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
