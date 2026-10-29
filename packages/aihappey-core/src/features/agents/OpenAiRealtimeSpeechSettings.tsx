import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { openAiSpeechVoices } from "../speech/realtime/openAiSpeechConfig";

/** Portable agent settings only: HTTP audio formats and HTTP-only voices are not offered here. */
export function OpenAiRealtimeSpeechSettings({ config, updateConfig }: {
    config: Record<string, any>; updateConfig: (config: Record<string, any>) => void;
}) {
    const { Card, Select, Slider } = useTheme();
    const { t } = useTranslation();
    const voice = typeof config.voice === "string" ? config.voice : "marin";
    const voices = [...new Set([...openAiSpeechVoices, voice])];
    return <Card size="small" title={t("general")}>
        <div style={{ display: "grid", gap: 16 }}>
            <Select label={t("speechSettings.voice")} values={[voice]} valueTitle={voice}
                options={voices.map(value => ({ value, label: value }))}
                onChange={(value: string) => updateConfig({ ...config, voice: value })}>
                {voices.map(value => <option key={value} value={value}>{value}</option>)}
            </Select>
            <Slider label={t("speechSettings.speedWithValue", { speed: config.speed ?? 1 })}
                min={0.25} max={1.5} step={0.05} value={config.speed ?? 1}
                onChange={(speed: number) => updateConfig({ ...config, speed })} />
        </div>
    </Card>;
}
