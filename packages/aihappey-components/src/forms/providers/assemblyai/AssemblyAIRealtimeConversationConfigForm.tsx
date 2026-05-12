import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../..";
import type { AssemblyAIRealtimeConversationConfig } from "./types";
import { normalizeList, parseOptionalInt, parseOptionalNumber } from "./fields/shared";
import { StringListEditor } from "./fields/StringListEditor";

const DEFAULT_VALUE = "__default__";

const ASSEMBLYAI_VOICES = ["ivy", "lucas", "claire", "michael"] as const;

const audioFormatOptions = [
  { value: DEFAULT_VALUE, label: "Provider default" },
  { value: "audio/pcm", label: "audio/pcm" },
  { value: "audio/pcmu", label: "audio/pcmu" },
  { value: "audio/pcma", label: "audio/pcma" },
];

const cleanString = (value: unknown) => {
  const raw = String(value ?? "").trim();
  return raw.length ? raw : undefined;
};

const hasAnyValue = (value: any): boolean => {
  if (value === undefined) return false;
  if (value === null) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value !== "object") return true;
  return Object.values(value).some(hasAnyValue);
};

const compactObject = <T extends Record<string, any>>(value: T): T => {
  const next: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) continue;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      const compacted = compactObject(child);
      if (hasAnyValue(compacted)) next[key] = compacted;
      continue;
    }
    next[key] = child;
  }
  return next as T;
};

export type AssemblyAIRealtimeConversationConfigFormProps = {
  config: AssemblyAIRealtimeConversationConfig;
  updateConfig: (val: AssemblyAIRealtimeConversationConfig) => void;
};

export const AssemblyAIRealtimeConversationConfigForm: React.FC<AssemblyAIRealtimeConversationConfigFormProps> = ({
  config,
  updateConfig,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const session = config?.session ?? {};
  const input = session.input ?? {};
  const output = session.output ?? {};
  const turnDetection = input.turn_detection ?? {};
  const keyterms = normalizeList(input.keyterms);
  const expiresAfter = config?.expires_after ?? {};

  const updateSession = (patch: Partial<NonNullable<AssemblyAIRealtimeConversationConfig["session"]>>) => {
    updateConfig({
      ...config,
      session: compactObject({
        ...(config.session ?? {}),
        ...patch,
      }) as NonNullable<AssemblyAIRealtimeConversationConfig["session"]>,
    });
  };

  const updateInput = (patch: Partial<NonNullable<AssemblyAIRealtimeConversationConfig["session"]>["input"]>) => {
    updateSession({
      input: compactObject({
        ...(session.input ?? {}),
        ...patch,
      }),
    });
  };

  const updateOutput = (patch: Partial<NonNullable<AssemblyAIRealtimeConversationConfig["session"]>["output"]>) => {
    updateSession({
      output: compactObject({
        ...(session.output ?? {}),
        ...patch,
      }),
    });
  };

  const updateTurnDetection = (patch: Partial<NonNullable<NonNullable<NonNullable<AssemblyAIRealtimeConversationConfig["session"]>["input"]>["turn_detection"]>>) => {
    updateInput({
      turn_detection: compactObject({
        ...(input.turn_detection ?? {}),
        ...patch,
      }),
    });
  };

  const inputFormatValue = input.format?.encoding ?? DEFAULT_VALUE;
  const outputFormatValue = output.format?.encoding ?? DEFAULT_VALUE;
  const voiceValue = output.voice ?? DEFAULT_VALUE;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general") ?? "General"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("speechSettings.voice")}
            values={[voiceValue]}
            valueTitle={voiceValue === DEFAULT_VALUE ? t("providerDefault") : voiceValue}
            options={[{ value: DEFAULT_VALUE, label: t("providerDefault") }, ...ASSEMBLYAI_VOICES.map((voice) => ({ value: voice, label: voice }))]}
            onChange={(value: string) => updateOutput({ voice: value === DEFAULT_VALUE ? undefined : value })}
          >
            <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
            {ASSEMBLYAI_VOICES.map((voice) => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </theme.Select>

          <theme.Input
            id="assemblyai-realtime-agent-token-ttl-seconds"
            type="number"
            min={1}
            max={600}
            step={30}
            label="Token TTL seconds"
            value={expiresAfter.seconds ?? ""}
            onChange={(e: any) => {
              const seconds = parseOptionalInt(e?.target?.value);
              updateConfig({
                ...config,
                expires_after: seconds ? { ...(config.expires_after ?? {}), anchor: "created_at", seconds } : undefined,
              });
            }}
          />

          <theme.Input
            id="assemblyai-realtime-agent-greeting"
            label="Greeting"
            value={session.greeting ?? ""}
            onChange={(e: any) => updateSession({ greeting: cleanString(e?.target?.value ?? e) })}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title="Audio">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label="Input format"
            values={[inputFormatValue]}
            valueTitle={inputFormatValue === DEFAULT_VALUE ? t("providerDefault") : inputFormatValue}
            options={audioFormatOptions.map((option) => option.value === DEFAULT_VALUE ? { ...option, label: t("providerDefault") } : option)}
            onChange={(value: string) => updateInput({ format: value === DEFAULT_VALUE ? undefined : { encoding: value as any } })}
          >
            {audioFormatOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.value === DEFAULT_VALUE ? t("providerDefault") : option.label}</option>
            ))}
          </theme.Select>

          <theme.Select
            label="Output format"
            values={[outputFormatValue]}
            valueTitle={outputFormatValue === DEFAULT_VALUE ? t("providerDefault") : outputFormatValue}
            options={audioFormatOptions.map((option) => option.value === DEFAULT_VALUE ? { ...option, label: t("providerDefault") } : option)}
            onChange={(value: string) => updateOutput({ format: value === DEFAULT_VALUE ? undefined : { encoding: value as any } })}
          >
            {audioFormatOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.value === DEFAULT_VALUE ? t("providerDefault") : option.label}</option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card size="small" title="Turn detection">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="assemblyai-realtime-agent-vad-threshold"
            type="number"
            min={0}
            max={1}
            step={0.05}
            label="VAD threshold"
            value={turnDetection.vad_threshold ?? ""}
            onChange={(e: any) => updateTurnDetection({ vad_threshold: parseOptionalNumber(e?.target?.value) })}
          />

          <theme.Input
            id="assemblyai-realtime-agent-min-silence"
            type="number"
            min={0}
            step={100}
            label="Minimum silence ms"
            value={turnDetection.min_silence ?? ""}
            onChange={(e: any) => updateTurnDetection({ min_silence: parseOptionalInt(e?.target?.value) })}
          />

          <theme.Input
            id="assemblyai-realtime-agent-max-silence"
            type="number"
            min={0}
            step={100}
            label="Maximum silence ms"
            value={turnDetection.max_silence ?? ""}
            onChange={(e: any) => updateTurnDetection({ max_silence: parseOptionalInt(e?.target?.value) })}
          />

          <theme.Switch
            id="assemblyai-realtime-agent-interrupt-response"
            label="Interrupt response"
            checked={turnDetection.interrupt_response ?? true}
            onChange={(enabled) => updateTurnDetection({ interrupt_response: !!enabled })}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title="Key terms">
        <StringListEditor
          idPrefix="assemblyai-realtime-agent-keyterms"
          label="Key terms"
          placeholder="Product names, people, jargon"
          items={keyterms}
          onChange={(next) => updateInput({ keyterms: next.length ? next : undefined })}
        />
      </theme.Card>

      <theme.Card size="small" title="System prompt override">
        <theme.TextArea
          rows={4}
          value={session.system_prompt ?? ""}
          onChange={(value) => updateSession({ system_prompt: cleanString(value) })}
        />
      </theme.Card>
    </div>
  );
};

