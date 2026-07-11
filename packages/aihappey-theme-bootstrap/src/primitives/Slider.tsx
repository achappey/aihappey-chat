// Pure function component, no React import, using Bootstrap Form.Range
import { JSX } from "react";
import { Form } from "react-bootstrap";

type SliderProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
  className?: string;
  style?: React.CSSProperties;
};

type RangeProps = Omit<SliderProps, "value" | "onChange"> & {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  minLabel?: string;
  maxLabel?: string;
};

export const Slider = ({
  id,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  disabled,
  showValue,
  valueFormat,
  className,
  style,
}: SliderProps): JSX.Element => {
  const sliderId = id || `slider-${Math.random().toString(36).slice(2, 10)}`;
  const formattedValue = valueFormat ? valueFormat(value) : value;

  return (
    <div className={className} style={style}>
      {label && (
        <Form.Label htmlFor={sliderId} style={{ fontWeight: 500 }}>
          {label}
          {showValue && (
            <span style={{ marginLeft: 8 }}>{formattedValue}</span>
          )}
        </Form.Label>
      )}
      <Form.Range
        id={sliderId}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      />
      {!label && showValue && (
        <div style={{ marginTop: 4, fontWeight: 500 }}>{formattedValue}</div>
      )}
    </div>
  );
};

export const Range = ({
  id,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  minLabel = "Minimum",
  maxLabel = "Maximum",
  disabled,
  showValue,
  valueFormat,
  className,
  style,
}: RangeProps): JSX.Element => {
  const rangeId = id || `range-${Math.random().toString(36).slice(2, 10)}`;
  const current: [number, number] = Array.isArray(value)
    ? [Number(value[0] ?? min), Number(value[1] ?? max)]
    : [min, max];
  const formatValue = (next: number) => valueFormat ? valueFormat(next) : next;

  return (
    <div className={className} style={style}>
      {label && (
        <Form.Label style={{ fontWeight: 500 }}>
          {label}
          {showValue && (
            <span style={{ marginLeft: 8 }}>{formatValue(current[0])} – {formatValue(current[1])}</span>
          )}
        </Form.Label>
      )}
      <Form.Label htmlFor={`${rangeId}-min`} style={{ fontWeight: 500 }}>{minLabel}</Form.Label>
      <Form.Range
        id={`${rangeId}-min`}
        value={current[0]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={e => onChange([Math.min(Number(e.target.value), current[1]), current[1]])}
        aria-valuenow={current[0]}
        aria-valuemin={min}
        aria-valuemax={max}
      />
      <Form.Label htmlFor={`${rangeId}-max`} style={{ fontWeight: 500 }}>{maxLabel}</Form.Label>
      <Form.Range
        id={`${rangeId}-max`}
        value={current[1]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={e => onChange([current[0], Math.max(Number(e.target.value), current[0])])}
        aria-valuenow={current[1]}
        aria-valuemin={min}
        aria-valuemax={max}
      />
    </div>
  );
};
