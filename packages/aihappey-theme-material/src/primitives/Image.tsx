import { Box } from "@mui/material";

export const Image = ({ fit, shape, style, width, height, ...props }: any) => <Box component="img" sx={{ objectFit: fit === "default" ? undefined : fit ?? "contain", width, height, maxWidth: "100%", borderRadius: shape === "square" ? 1 : shape === "circle" ? "50%" : undefined, display: "block", ...style }} {...props} />;

