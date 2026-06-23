import * as React from "react";
import { Alert as MuiAlert, Box, CircularProgress, LinearProgress, Skeleton as MuiSkeleton, Snackbar, Typography } from "@mui/material";
import type { ToastProps } from "aihappey-types/src/theme/Toast";
import { mapColor, mapSize } from "./utils";

export const Alert = ({ variant, title, onDismiss, className, children }: any) => (
  <MuiAlert severity={mapColor(variant) ?? "info"} className={className} onClose={onDismiss}>{title ? <strong>{title}</strong> : null}{title ? " " : null}{children}</MuiAlert>
);

export const Spinner = ({ size = "sm", label, className }: any) => <Box className={className} sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}><CircularProgress size={mapSize(size) === "large" ? 28 : 18} />{label ? <Typography variant="body2">{label}</Typography> : null}</Box>;

export const ProgressBar = ({ value, label, variant, striped, animated, className }: any) => (
  <Box className={className}>
    <LinearProgress variant={value == null || animated ? "indeterminate" : "determinate"} value={value ?? 0} color={mapColor(variant) ?? "primary"} />
    {label ? <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>{label}</Typography> : null}
  </Box>
);

export const Skeleton = (props: any) => <MuiSkeleton {...props} variant={props.circle ? "circular" : props.variant ?? "rectangular"} />;

export const Toast = ({ id, variant, message, show, autohide, onClose }: ToastProps) => (
  <Snackbar key={id} open={show} autoHideDuration={autohide ?? 4000} onClose={onClose as any}>
    <MuiAlert severity={mapColor(variant) ?? "info"} onClose={onClose as any}>{message}</MuiAlert>
  </Snackbar>
);

export const Toaster = ({ toasts = [], position }: any) => <>{toasts.map((toast: any) => <Toast key={toast.id} {...toast} />)}</>;

