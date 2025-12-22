// Pure function component, no React import, using Fluent UI Slider
import {
  useId,
  Slider as FluentSlider,
  Field,
  Label,
} from "@fluentui/react-components";

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
  const sliderId = id || useId();
  const formattedValue = valueFormat ? valueFormat(value) : value;

  const handleChange: Parameters<typeof FluentSlider>[0]["onChange"] = (
    _,
    data
  ) => {
    onChange(data.value);
  };

  const slider = (
    <FluentSlider
      id={sliderId}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      disabled={disabled}
      className={className}
      style={!label ? style : undefined}
      aria-valuetext={
        typeof formattedValue === "string"
          ? formattedValue
          : `Value is ${value}`
      }
    />
  );

  return label ? (
    <Field
      style={style}
      label={
        <>
          {label}
          {showValue && (
            <span style={{ marginLeft: 8, fontWeight: 500 }}>
              {formattedValue}
            </span>
          )}
        </>
      }
    >
      {slider}
    </Field>
  ) : (
    <>
      {slider}
      {showValue && (
        <Label htmlFor={sliderId} style={{ marginLeft: 8 }}>
          {formattedValue}
        </Label>
      )}
    </>
  );
};
