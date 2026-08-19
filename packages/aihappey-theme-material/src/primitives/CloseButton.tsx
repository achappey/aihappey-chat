import { IconButton, Tooltip } from "@mui/material";
import { renderIcon } from "./icons";

export const CloseButton = ({ onClick, title = "Close", disabled, ...props }: any) => {
  const button = (
    <IconButton aria-label={props["aria-label"] ?? title} disabled={disabled} onClick={onClick} size="small" {...props}>
      {renderIcon("dismiss", 18)}
    </IconButton>
  );

  return (
    <Tooltip title={title} describeChild arrow>
      {disabled ? <span style={{ display: "inline-flex" }}>{button}</span> : button}
    </Tooltip>
  );
};

