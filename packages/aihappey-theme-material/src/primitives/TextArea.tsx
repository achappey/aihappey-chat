import { TextField } from "@mui/material";

export const TextArea = ({ label, hint, required, rows, readOnly, value, onChange, style, className, ...rest }: any) => (
  <TextField
    label={label}
    helperText={hint}
    required={required}
    multiline
    minRows={rows}
    value={value}
    disabled={readOnly}
    className={className}
    sx={style}
    fullWidth
    onChange={(event) => onChange?.(event.currentTarget.value)}
    {...rest}
  />
);

