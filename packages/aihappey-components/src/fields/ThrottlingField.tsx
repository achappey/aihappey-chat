import { useTheme } from "../theme/ThemeContext";

type ThrottlingFieldProps = {
  value: number;
  onChange: (throttle: number) => void;
  translations?: any;
  min?: number;
  max?: number;
  step?: number;
};

export const ThrottlingField = ({
  value,
  onChange,
  translations,
  min = 0,
  max = 1000,
  step = 10,
}: ThrottlingFieldProps) => {
  const { Slider } = useTheme();

  return (
    <Slider
      label={(translations?.throttle ?? "throttle") + ` (${value} ms)`}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
    />
  );
};
