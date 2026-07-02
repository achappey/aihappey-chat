import * as React from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  tokens,
} from "@fluentui/react-components";
import { JSX } from "react";

export const Modal = ({
  open,
  show,
  isOpen,
  onHide,
  onClose,
  onOpenChange,
  size,
  title,
  centered,
  modalType,
  children,
  actions,
}: {
  open?: boolean;
  show?: boolean;
  isOpen?: boolean;
  onHide?: () => void;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  size?: string;
  modalType?: string
  title: string;
  centered?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}): JSX.Element => {
  const opened = !!(show ?? open ?? isOpen);

  if (modalType === "alert") {
    if (!opened) return <></>;

    return (
      <div
        role="presentation"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: tokens.colorBackgroundOverlay,
        }}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
          style={{
            width: size === "small" || size === "sm"
              ? "360px"
              : size === "large" || size === "lg"
                ? "720px"
                : size === "full"
                  ? "calc(100vw - 48px)"
                  : "600px",
            maxWidth: "calc(100vw - 48px)",
            maxHeight: "calc(100vh - 48px)",
            overflow: "auto",
            boxSizing: "border-box",
            padding: "24px",
            border: `1px solid ${tokens.colorTransparentStroke}`,
            borderRadius: tokens.borderRadiusXLarge,
            backgroundColor: tokens.colorNeutralBackground1,
            color: tokens.colorNeutralForeground1,
            boxShadow: tokens.shadow64,
          }}
        >
          <DialogBody style={{ width: "100%" }}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>{children}</DialogContent>
            {actions && <DialogActions>{actions}</DialogActions>}
          </DialogBody>
        </div>
      </div>
    );
  }

  return (
    <Dialog
      modalType={modalType as any}
      open={opened}
      onOpenChange={(_, data) => {
        onOpenChange?.(data.open);
        if (!data.open) {
          onHide?.();
          onClose?.();
        }
      }}
    >
      <DialogSurface
        style={
          centered
            ? {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }
            : undefined
        }
      >
        <DialogBody style={{ width: "100%" }}>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>{children}</DialogContent>
          {actions && <DialogActions>{actions}</DialogActions>}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
