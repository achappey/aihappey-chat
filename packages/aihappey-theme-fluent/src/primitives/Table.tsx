import * as React from "react";
import { Table as FluentTable } from "@fluentui/react-components";

export const Table = (props: {
  hover?: boolean;
  bordered?: boolean;
  striped?: boolean;
  borderless?: boolean;
  size?: string;
  children: React.ReactNode;
}): JSX.Element => (
  <FluentTable {...(props as any)}>{props.children}</FluentTable>
);
