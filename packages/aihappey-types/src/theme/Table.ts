import type * as React from "react";
import type { JSX } from "react";

export type TableProps = {
  hover?: boolean;
  bordered?: boolean;
  striped?: boolean;
  borderless?: boolean;
  size?: string;
  children: React.ReactNode;
};

export type TableComponent = (props: TableProps) => JSX.Element;
