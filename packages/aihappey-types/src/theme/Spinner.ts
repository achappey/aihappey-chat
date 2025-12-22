import type { JSX } from "react";

export type SpinnerProps = { size?: string; label?: string; className?: string };

export type SpinnerComponent = (props: SpinnerProps) => JSX.Element;
