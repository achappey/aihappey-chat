import type * as React from "react";
import type { JSX } from "react";

/**
 * Toast notification primitive for status/info/success/error.
 */
export type ToastProps = {
  id: string;
  variant: "info" | "success" | "error";
  message: React.ReactNode;
  show: boolean;
  autohide?: number;
  onClose?: () => void;
};

export type ToastComponent = (props: ToastProps) => JSX.Element;
