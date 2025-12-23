import { useTheme } from "../theme/ThemeContext";

type TemperatureFieldProps = {
    value: number
    onChange: (temperature: number) => void
    translations?: any
};

export const TemperatureField = ({
    value,
    onChange,
    translations
}: TemperatureFieldProps) => {
    const { Slider } = useTheme();

    return (<Slider
        label={(translations?.temperature ?? 'temperature') + ` (${value})`}
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={onChange}
    />
    )
};
