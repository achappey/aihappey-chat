import type { JSX } from "react";

export type ToasterProps = {
  toasts: any[];
  toasterId?: string;
  position?: any;
};

export type ToasterComponent = (props: ToasterProps) => JSX.Element;
