import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { Toast as BsToast, ToastContainer, Spinner } from "react-bootstrap";

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
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (show && autohide) {
      timer.current = window.setTimeout(() => {
        onClose?.();
      }, autohide);

      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }
    return;
  }, [show, autohide, onClose]);

  let bsVariant = "secondary";
  if (variant === "success") bsVariant = "success";
  if (variant === "error") bsVariant = "danger";

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000 }}>
      <BsToast
        show={show}
        onClose={onClose}
        bg={bsVariant}
        autohide={!!autohide}
        delay={autohide}
        data-testid={`status-toast-${id}`}
      >
        <BsToast.Body
          className="d-flex align-items-center text-white"
          role="status"
        >
          {variant === "info" && (
            <Spinner animation="border" size="sm" className="me-2" />
          )}
          {message}
        </BsToast.Body>
      </BsToast>
    </ToastContainer>
  );
};
