import type { ReactNode } from "react";
import { useTheme } from "../theme/ThemeContext";

export type WizardModalProps = {
  open: boolean;
  title: string;
  size?: "small" | "medium" | "large";
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
};

export const WizardModal = ({
  open,
  title,
  size = "medium",
  onClose,
  children,
  actions,
}: WizardModalProps) => {
  const { Modal } = useTheme();

  return (
    <Modal
      show={open}
      size={size}
      title={title}
      onHide={onClose}
      actions={actions}
    >
      {children}
    </Modal>
  );
};
