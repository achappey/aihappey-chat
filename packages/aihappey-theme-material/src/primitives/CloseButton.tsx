import { IconButton } from "@mui/material";
import { renderIcon } from "./icons";

export const CloseButton = ({ onClick, title = "Close", ...props }: any) => (
  <IconButton aria-label={props["aria-label"] ?? title} title={title} onClick={onClick} size="small" {...props}>
    {renderIcon("dismiss", 18)}
  </IconButton>
);

