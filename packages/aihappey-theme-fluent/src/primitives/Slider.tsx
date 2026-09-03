// Pure function component, no React import, using Fluent UI Slider
import {
  useId,
  Slider as FluentSlider,
  Field,
  Label,
} from "@fluentui/react-components";
import { JSX } from "react";

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
  const generatedId = useId();
  const sliderId = id || generatedId;
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
      // Fluent uses its top-level `step` both for native stepping and to draw
      // separators on the rail. Fine-grained ranges can therefore paint
      // thousands of separators and visually cover the official rail. Put the
      // step on the official input slot instead: keyboard/pointer stepping is
      // preserved without opting into those decorative separators.
      input={{ step }}
      onChange={handleChange}
      disabled={disabled}
      className={className}
      // Fluent's Slider root is an inline grid. Give that official root an
      // explicit width so it cannot collapse to its thumb in grid/flex forms.
      // Rail, progress, thumb, and interaction styling remain entirely Fluent.
      style={{ width: "100%", ...(!label ? style : undefined) }}
      aria-valuetext={
        typeof formattedValue === "string"
          ? formattedValue
          : `Value is ${value}`
      }
    />
  );

  return label ? (
    <Field
      style={{ width: "100%", minWidth: 0, ...style }}
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
  const generatedId = useId();
  const rangeId = id || generatedId;
  const current: [number, number] = Array.isArray(value)
    ? [Number(value[0] ?? min), Number(value[1] ?? max)]
    : [min, max];
  const formatValue = (next: number) => valueFormat ? valueFormat(next) : next;

  const minSlider = (
    <FluentSlider
      id={`${rangeId}-min`}
      value={current[0]}
      min={min}
      max={max}
      input={{ step }}
      onChange={(_, data) => onChange([Math.min(data.value, current[1]), current[1]])}
      disabled={disabled}
      aria-label={minLabel}
      aria-valuetext={String(formatValue(current[0]))}
      style={{ width: "100%" }}
    />
  );

  const maxSlider = (
    <FluentSlider
      id={`${rangeId}-max`}
      value={current[1]}
      min={min}
      max={max}
      input={{ step }}
      onChange={(_, data) => onChange([current[0], Math.max(data.value, current[0])])}
      disabled={disabled}
      aria-label={maxLabel}
      aria-valuetext={String(formatValue(current[1]))}
      style={{ width: "100%" }}
    />
  );

  return (
    <Field
      className={className}
      style={{ width: "100%", minWidth: 0, ...style }}
      label={
        label ? (
          <>
            {label}
            {showValue && (
              <span style={{ marginLeft: 8, fontWeight: 500 }}>
                {formatValue(current[0])} – {formatValue(current[1])}
              </span>
            )}
          </>
        ) : undefined
      }
    >
      <div style={{ display: "grid", gap: 8 }}>
        <Field label={minLabel}>{minSlider}</Field>
        <Field label={maxLabel}>{maxSlider}</Field>
      </div>
    </Field>
  );
};
