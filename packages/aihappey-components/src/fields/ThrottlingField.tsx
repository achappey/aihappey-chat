import { memo } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

type ThrottlingFieldProps = {
  value: number;
  onChange: (throttle: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export const ThrottlingField = memo(({
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 10,
}: ThrottlingFieldProps) => {
  const { Slider } = useTheme();
  const { t } = useTranslation();

  return (
    <Slider
      label={t("throttle", { throttle: value })}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
    />
  );
});
