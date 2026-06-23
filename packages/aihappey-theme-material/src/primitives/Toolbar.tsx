import { Box, Divider } from "@mui/material";
import { Button } from "./Button";

export const Toolbar = ({ children, ariaLabel, className }: any) => <Box role="toolbar" aria-label={ariaLabel} className={className} sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center" }}>{children}</Box>;
export const ToolbarButton = (props: any) => <Button variant={props.variant ?? "subtle"} {...props} />;
export const ToolbarDivider = () => <Divider orientation="vertical" flexItem />;

