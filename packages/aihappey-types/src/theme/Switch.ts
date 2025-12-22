import type { JSX } from "react";

export type SwitchProps = {
  id: string;
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  checked: boolean;
  size?: string;
  onChange: (checked: boolean) => void;
  className?: string;
};

export type SwitchComponent = (props: SwitchProps) => JSX.Element;
