import { TextField } from "@mui/material";
import { mapSize } from "./utils";

export const Input = ({ label, hint, required, size, style, onChange, ...rest }: any) => (
  <TextField
    label={label}
    helperText={hint}
    required={required}
    size={mapSize(size) === "large" ? "medium" : "small"}
    fullWidth={rest.fullWidth ?? true}
    sx={style}
    onChange={onChange}
    {...rest}
  />
);

