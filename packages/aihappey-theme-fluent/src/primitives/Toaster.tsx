import type { JSX, ReactNode } from "react";
import { useEffect, useRef } from "react";
import {
  Toaster as FToaster,
  useToastController,
  Toast as FToast,
  ToastTitle,
} from "@fluentui/react-toast";
import { Spinner } from "./Spinner";

export type ToastItem = {
  id: string;
  variant: "info" | "success" | "error";
  message: ReactNode;
  show: boolean;
  autohide?: number;        // ms
  onClose?: () => void;     // called when we dismiss (incl. autohide)
};

type Props = {
  toasts: ToastItem[];
  toasterId?: string;
  position?: React.ComponentProps<typeof FToaster>["position"];
};

export function Toaster({
  toasts,
  toasterId = "status",
  position = "top-end",
}: Props): JSX.Element {
  const { dispatchToast, dismissToast } = useToastController(toasterId);

  // Track which toasts we’ve shown + their timers
  const shownRef = useRef(
    new Map<string, { timer?: number }>()
  );

  useEffect(() => {
    const shown = shownRef.current;
    const currentIds = new Set(toasts.map(t => t.id));

    // Dismiss any that were shown but are no longer in props
    for (const [id, state] of shown) {
      if (!currentIds.has(id)) {
        dismissToast(id);
        if (state.timer) window.clearTimeout(state.timer);
        shown.delete(id);
      }
    }

    // Handle incoming updates
    for (const t of toasts) {
      const isShown = shown.has(t.id);

      // Show new toast
      if (t.show && !isShown) {
        dispatchToast(
          <FToast>
            <ToastTitle>
              {t.message}
            </ToastTitle>
          </FToast>,
          {
            toastId: t.id,
            intent:
              t.variant === "info"
                ? "info"
                : t.variant === "success"
                ? "success"
                : "error",
          }
        );

        const timer = t.autohide
          ? window.setTimeout(() => {
              dismissToast(t.id);
              t.onClose?.();
              const s = shownRef.current.get(t.id);
              if (s?.timer) window.clearTimeout(s.timer);
              shownRef.current.delete(t.id);
            }, t.autohide)
          : undefined;

        shown.set(t.id, { timer });
      }

      // Dismiss toggled-off toast
      if (!t.show && isShown) {
        dismissToast(t.id);
        const s = shown.get(t.id);
        if (s?.timer) window.clearTimeout(s.timer);
        shown.delete(t.id);
        t.onClose?.();
      }
    }

    // Cleanup on unmount
    return () => {
      for (const [, s] of shownRef.current) {
        if (s.timer) window.clearTimeout(s.timer);
      }
    };
  }, [toasts, dispatchToast, dismissToast]);

  return <FToaster toasterId={toasterId} position={position} />;
}
