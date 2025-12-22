import type { ComponentProps, JSX } from "react";

export type InputProps = ComponentProps<"input"> & {
  label?: string;
  orientation?: "horizontal" | "vertical";
  hint?: string;
};

export type InputComponent = (props: InputProps) => JSX.Element;
