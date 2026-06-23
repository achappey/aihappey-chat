import { Box, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { mapModalSize } from "./utils";

export const Modal = ({ title, children, actions, isOpen, open, show, onClose, onHide, onOpenChange, size, centered, modalType, ...rest }: any) => {
  const opened = !!(show ?? open ?? isOpen);
  const handleClose = () => {
    onOpenChange?.(false);
    onClose?.();
    onHide?.();
  };

  return (
    <Dialog open={opened} onClose={modalType === "alert" ? undefined : handleClose} maxWidth={false} PaperProps={{ sx: { width: mapModalSize(size), maxWidth: "calc(100vw - 32px)" } }} {...rest}>
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      <DialogContent>{children}</DialogContent>
      {actions ? <DialogActions>{actions}</DialogActions> : null}
    </Dialog>
  );
};

