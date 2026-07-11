import { FormControlLabel, Switch as MuiSwitch, Box, Slider as MuiSlider, Typography } from "@mui/material";

export const Switch = ({ id, label, checked, onChange, className, disabled }: any) => <FormControlLabel className={className} control={<MuiSwitch id={id} checked={checked} disabled={disabled} onChange={(event) => onChange?.(event.currentTarget.checked)} />} label={label} />;

export const Slider = ({ value, min, max, step, onChange, label, marks, disabled, className, style }: any) => (
  <Box className={className} sx={style}>
    {label ? <Typography variant="body2">{label}</Typography> : null}
    <MuiSlider value={value} min={min} max={max} step={step} onChange={(_, next) => onChange?.(next)} marks={marks} disabled={disabled} />
  </Box>
);

export const Range = ({ value, min = 0, max = 100, step = 1, onChange, label, marks, disabled, className, style, showValue, valueFormat, minLabel = "Minimum", maxLabel = "Maximum" }: any) => {
  const nextValue = Array.isArray(value) ? [Number(value[0] ?? min), Number(value[1] ?? max)] : [min, max];
  const formatValue = (v: number) => valueFormat ? valueFormat(v) : String(v);

  return (
    <Box className={className} sx={style}>
      {label ? <Typography variant="body2">{label}{showValue ? ` ${formatValue(nextValue[0])} – ${formatValue(nextValue[1])}` : ""}</Typography> : null}
      <MuiSlider
        value={nextValue}
        min={min}
        max={max}
        step={step}
        onChange={(_, next) => Array.isArray(next) && onChange?.([Number(next[0]), Number(next[1])])}
        marks={marks}
        disabled={disabled}
        valueLabelDisplay={showValue ? "auto" : "off"}
        getAriaLabel={(index) => index === 0 ? minLabel : maxLabel}
        valueLabelFormat={valueFormat}
      />
    </Box>
  );
};

