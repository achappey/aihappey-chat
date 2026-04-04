import { useTheme } from "../../theme/ThemeContext";
import {
  parseOptionalInteger,
  parseOptionalNumber,
  useObjectUpdater,
} from "./shared";

export type ChatCompletionsEndpointConfig = {
  stream?: boolean;
  n?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  parallel_tool_calls?: boolean;
  service_tier?: string;
  reasoning_effort?: string;
  verbosity?: string;
};

export const ChatCompletionsEndpointConfigForm = ({
  value,
  onChange,
}: {
  value: ChatCompletionsEndpointConfig;
  onChange: (next: ChatCompletionsEndpointConfig) => void;
}) => {
  const theme = useTheme();
  const updateField = useObjectUpdater(value, onChange);
  const serviceTierOptions = ["auto", "default", "flex", "scale", "priority"];
  const reasoningEffortOptions = ["none", "minimal", "low", "medium", "high", "xhigh"];
  const verbosityOptions = ["low", "medium", "high"];

  return (
    <theme.Card size="small" title="Chat Completions">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Switch
          id="chatCompletionsStream"
          label="Stream"
          checked={!!value.stream}
          onChange={(next) => updateField("stream", next)}
        />
        <theme.Switch
          id="chatCompletionsParallelToolCalls"
          label="Parallel tool calls"
          checked={!!value.parallel_tool_calls}
          onChange={(next) => updateField("parallel_tool_calls", next)}
        />

        <theme.Input
          type="number"
          min={1}
          step={1}
          label="Choices (n)"
          value={value.n ?? ""}
          onChange={(e) => updateField("n", parseOptionalInteger(e?.target?.value))}
        />

        <theme.Input
          type="number"
          min={0}
          max={1}
          step={0.01}
          label="top_p"
          value={value.top_p ?? ""}
          onChange={(e) => updateField("top_p", parseOptionalNumber(e?.target?.value))}
        />

        <theme.Input
          type="number"
          min={-2}
          max={2}
          step={0.1}
          label="presence_penalty"
          value={value.presence_penalty ?? ""}
          onChange={(e) => updateField("presence_penalty", parseOptionalNumber(e?.target?.value))}
        />

        <theme.Input
          type="number"
          min={-2}
          max={2}
          step={0.1}
          label="frequency_penalty"
          value={value.frequency_penalty ?? ""}
          onChange={(e) => updateField("frequency_penalty", parseOptionalNumber(e?.target?.value))}
        />

        <theme.Select
          label="service_tier"
          values={[value.service_tier ?? ""]}
          valueTitle={value.service_tier ?? "Default"}
          options={serviceTierOptions.map((item) => ({ value: item, label: item }))}
          onChange={(next: string) => updateField("service_tier", String(next || "") || undefined)}
        >
          <option value="">Default</option>
          {serviceTierOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </theme.Select>

        <theme.Select
          label="reasoning_effort"
          values={[value.reasoning_effort ?? ""]}
          valueTitle={value.reasoning_effort ?? "Default"}
          options={reasoningEffortOptions.map((item) => ({ value: item, label: item }))}
          onChange={(next: string) => updateField("reasoning_effort", String(next || "") || undefined)}
        >
          <option value="">Default</option>
          {reasoningEffortOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </theme.Select>

        <theme.Select
          label="verbosity"
          values={[value.verbosity ?? ""]}
          valueTitle={value.verbosity ?? "Default"}
          options={verbosityOptions.map((item) => ({ value: item, label: item }))}
          onChange={(next: string) => updateField("verbosity", String(next || "") || undefined)}
        >
          <option value="">Default</option>
          {verbosityOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </theme.Select>
      </div>
    </theme.Card>
  );
};

