import type * as React from "react";
import type { JSX } from "react";

export type ModalProps = {
  title: string;
  modalType?: string;
  show: boolean;
  onHide: () => void;
  size?: string;
  centered?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export type ModalComponent = (props: ModalProps) => JSX.Element;
