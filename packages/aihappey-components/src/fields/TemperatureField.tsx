import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

type TemperatureFieldProps = {
    value: number
    onChange: (temperature: number) => void
};

export const TemperatureField = ({
    value,
    onChange,
}: TemperatureFieldProps) => {
    const { Slider } = useTheme();
    const { t } = useTranslation();

    return (<Slider
        label={t("temperature", { temperature: value })}
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={onChange}
    />
    )
};
