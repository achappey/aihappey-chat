import { TemperatureField } from "../fields";
import { useTheme } from "../theme/ThemeContext";

type AiSettings = {
    temperature: number
};

type AiSettingsFormProps = {
    value: AiSettings
    onChange: (settings: AiSettings) => void
    translations?: any
    formTitle?: string
};

export const AiSettingsForm = ({
    value,
    onChange,
    formTitle,
    translations
}: AiSettingsFormProps) => {
    const { Card } = useTheme();

    return (<Card size="small" title={formTitle}>
        <div>
            <TemperatureField
                translations={translations}
                value={value?.temperature}
                onChange={(temperature) => onChange({
                    ...value,
                    temperature
                })} />
        </div>
    </Card>
    )
};
