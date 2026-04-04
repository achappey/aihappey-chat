import { useTheme } from "../../theme/ThemeContext";
import {
    linesToText,
    parseLines,
    parseOptionalInteger,
    parseOptionalNumber,
} from "./shared";

export type MessagesEndpointConfig = {
    stream?: boolean;
    top_p?: number;
    top_k?: number;
    service_tier?: string;
    container?: string;
    inference_geo?: string;
    stop_sequences?: string[];
    output_config?: {
        effort?: string;
    };
    thinking?: {
        type?: string;
        budget_tokens?: number;
        display?: string;
    };
};

export const MessagesEndpointConfigForm = ({
    value,
    onChange,
}: {
    value: MessagesEndpointConfig;
    onChange: (next: MessagesEndpointConfig) => void;
}) => {
    const theme = useTheme();
    const serviceTierOptions = ["auto", "standard_only"];
    const effortOptions = ["low", "medium", "high", "max"];
    const thinkingTypeOptions = ["disabled", "enabled", "adaptive"];
    const thinkingDisplayOptions = ["summarized", "omitted"];

    return (
        <theme.Card size="small" title="Messages">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Switch
                    id="messagesStream"
                    label="Stream"
                    checked={!!value.stream}
                    onChange={(next) => onChange({ ...value, stream: next })}
                />

                <theme.Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    label="top_p"
                    value={value.top_p ?? ""}
                    onChange={(e) => onChange({ ...value, top_p: parseOptionalNumber(e?.target?.value) })}
                />

                <theme.Input
                    type="number"
                    min={1}
                    step={1}
                    label="top_k"
                    value={value.top_k ?? ""}
                    onChange={(e) => onChange({ ...value, top_k: parseOptionalInteger(e?.target?.value) })}
                />

                <theme.Input
                    label="container"
                    placeholder="Optional container id"
                    value={value.container ?? ""}
                    onChange={(e) => onChange({ ...value, container: String(e?.target?.value ?? "") || undefined })}
                />

                <theme.Input
                    label="inference_geo"
                    placeholder="Optional inference region"
                    value={value.inference_geo ?? ""}
                    onChange={(e) => onChange({ ...value, inference_geo: String(e?.target?.value ?? "") || undefined })}
                />

                <theme.TextArea
                    label="stop_sequences"
                    rows={4}
                    value={linesToText(value.stop_sequences)}
                    onChange={(next) => onChange({ ...value, stop_sequences: parseLines(next) })}
                />

                <theme.Select
                    label="service_tier"
                    values={[value.service_tier ?? ""]}
                    valueTitle={value.service_tier ?? "Default"}
                    options={serviceTierOptions.map((item) => ({ value: item, label: item }))}
                    onChange={(next: string) => onChange({ ...value, service_tier: String(next || "") || undefined })}
                >
                    <option value="">Default</option>
                    {serviceTierOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </theme.Select>

                <theme.Select
                    label="output_config.effort"
                    values={[value.output_config?.effort ?? ""]}
                    valueTitle={value.output_config?.effort ?? "Default"}
                    options={effortOptions.map((item) => ({ value: item, label: item }))}
                    onChange={(next: string) => onChange({
                        ...value,
                        output_config: {
                            ...value.output_config,
                            effort: String(next || "") || undefined,
                        },
                    })}
                >
                    <option value="">Default</option>
                    {effortOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </theme.Select>

                <theme.Select
                    label="thinking.type"
                    values={[value.thinking?.type ?? ""]}
                    valueTitle={value.thinking?.type ?? "Default"}
                    options={thinkingTypeOptions.map((item) => ({ value: item, label: item }))}
                    onChange={(next: string) => onChange({
                        ...value,
                        thinking: {
                            ...value.thinking,
                            type: String(next || "") || undefined,
                        },
                    })}
                >
                    <option value="">Default</option>
                    {thinkingTypeOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </theme.Select>

                <theme.Input
                    type="number"
                    min={1024}
                    step={1}
                    label="thinking.budget_tokens"
                    value={value.thinking?.budget_tokens ?? ""}
                    onChange={(e) => onChange({
                        ...value,
                        thinking: {
                            ...value.thinking,
                            budget_tokens: parseOptionalInteger(e?.target?.value),
                        },
                    })}
                />

                <theme.Select
                    label="thinking.display"
                    values={[value.thinking?.display ?? ""]}
                    valueTitle={value.thinking?.display ?? "Default"}
                    options={thinkingDisplayOptions.map((item) => ({ value: item, label: item }))}
                    onChange={(next: string) => onChange({
                        ...value,
                        thinking: {
                            ...value.thinking,
                            display: String(next || "") || undefined,
                        },
                    })}
                >
                    <option value="">Default</option>
                    {thinkingDisplayOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </theme.Select>
            </div>
        </theme.Card>
    );
};

