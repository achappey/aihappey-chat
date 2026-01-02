import { TemperatureField } from "../../fields";
import { useTheme } from "../../theme/ThemeContext";

type AiChatSettings = {
    temperature: number
};

type AiChatSettingsFormProps = {
    value: AiChatSettings
    onChange: (settings: AiChatSettings) => void
    formTitle?: string
};

export const AiChatSettingsForm = ({
    value,
    onChange,
    formTitle,
}: AiChatSettingsFormProps) => {
    const { Card } = useTheme();

    return (<Card size="small" title={formTitle}>
        <div>
            <TemperatureField
                value={value?.temperature}
                onChange={(temperature) => onChange({
                    ...value,
                    temperature
                })} />
        </div>
    </Card>
    )
};
