import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { Toaster, useToastController, Toast as FToast, ToastTitle } from "@fluentui/react-toast";
import { Spinner } from "./Spinner";

type Props = {
  id: string;
  variant: "info" | "success" | "error";
  message: React.ReactNode;
  show: boolean;
  autohide?: number;
  onClose?: () => void;
};

export const Toast = ({
  id,
  variant,
  message,
  show,
  autohide,
  onClose,
}: Props): JSX.Element => {
  const { dispatchToast, dismissToast } = useToastController("status");
  const shown = useRef(false);

  useEffect(() => {
    if (show && !shown.current) {
      dispatchToast(
        <FToast
/*          onCl={() => {
            dismissToast(id);
            onClose?.();
          }}*/
         // toasterId={`status-toast-${id}`}
        >
          <ToastTitle>
            {variant === "info" && <Spinner size="tiny" />}
            {message}
          </ToastTitle>
        </FToast>,
        { intent: variant === "info" ? "info" 
            : variant === "success" ? "success" : "error" }
      );
      shown.current = true;
      if (autohide) {
        setTimeout(() => {
          dismissToast(id);
          onClose?.();
        }, autohide);
      }
    }
    if (!show && shown.current) {
      dismissToast(id);
      shown.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, message, variant, autohide, onClose]);

  return <Toaster toasterId="status" position="top-end" />;
};