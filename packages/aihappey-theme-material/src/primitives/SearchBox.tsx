import { InputAdornment, TextField } from "@mui/material";
import { renderIcon } from "./icons";

export const SearchBox = ({ value, onChange, placeholder, className, autoFocus }: any) => (
  <TextField
    value={value}
    placeholder={placeholder}
    className={className}
    autoFocus={autoFocus}
    size="small"
    fullWidth
    slotProps={{ input: { startAdornment: <InputAdornment position="start">{renderIcon("search")}</InputAdornment> } }}
    onChange={(event) => onChange(event.currentTarget.value)}
  />
);

