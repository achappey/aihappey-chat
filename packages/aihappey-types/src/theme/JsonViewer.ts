import type { JSX } from "react";

export type JsonViewerProps = {
  value: unknown;
  title?: string
};

export type JsonViewerComponent = (props: JsonViewerProps) => JSX.Element;
