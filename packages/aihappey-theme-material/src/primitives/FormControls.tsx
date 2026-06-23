import { FormControlLabel, Switch as MuiSwitch, Box, Slider as MuiSlider, Typography } from "@mui/material";

export const Switch = ({ id, label, checked, onChange, className, disabled }: any) => <FormControlLabel className={className} control={<MuiSwitch id={id} checked={checked} disabled={disabled} onChange={(event) => onChange?.(event.currentTarget.checked)} />} label={label} />;

export const Slider = ({ value, min, max, step, onChange, label, marks, disabled, className, style }: any) => (
  <Box className={className} sx={style}>
    {label ? <Typography variant="body2">{label}</Typography> : null}
    <MuiSlider value={value} min={min} max={max} step={step} onChange={(_, next) => onChange?.(next)} marks={marks} disabled={disabled} />
  </Box>
);

