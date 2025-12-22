// Pure function component, no React import, using Bootstrap Form.Range
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