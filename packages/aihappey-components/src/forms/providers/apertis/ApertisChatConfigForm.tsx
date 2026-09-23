import { useId } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import {
  type ApertisChatConfig,
  parseApertisInteger,
  updateApertisCompression,
  updateApertisReasoning,
} from "./apertisChatConfig";

export type { ApertisChatConfig } from "./apertisChatConfig";

const EFFORTS = ["", "low", "medium", "high"] as const;
const SUMMARIES = ["", "auto", "concise", "detailed"] as const;
const STRATEGIES = ["", "on", "conservative", "aggressive"] as const;
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  alignItems: "end",
} as const;

export const ApertisChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: ApertisChatConfig;
  updateConfig: (config: ApertisChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const id = useId();
  const tr = (key: string) => t(`providers:apertis.${key}`);
  const reasoning = config.reasoning ?? {};
  const reasoningOn = !!config.reasoning;
  const compression = config.compression ?? {};
  const enabled = compression.enabled ?? false;
  const notSet = tr("notSet");
  const effortLabel = (value: string) => value ? tr(`efforts.${value}`) : notSet;
  const summaryLabel = (value: string) => value ? tr(`summaries.${value}`) : notSet;
  const strategyLabel = (value: string) => tr(`strategies.${value || "default"}`);

  const updateInteger = (key: "threshold" | "keep_turns", value: string) => {
    const parsed = parseApertisInteger(value);
    if (parsed !== null) {
      updateConfig(updateApertisCompression(config, { [key]: parsed }));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={tr("reasoning")}
        headerActions={
          <theme.Switch
            id={`${id}-reasoning`}
            checked={reasoningOn}
            onChange={value => updateConfig(updateApertisReasoning(config,
              value ? { effort: "medium", summary: "auto" } : undefined,
            ))}
          />
        }
      >
        <div style={grid}>
          <theme.Select
            label={tr("effort")}
            disabled={!reasoningOn}
            values={[reasoning.effort ?? ""]}
            valueTitle={effortLabel(reasoning.effort ?? "")}
            options={EFFORTS.map(value => ({ value, label: effortLabel(value) }))}
            onChange={(value: string) => {
              if (EFFORTS.includes(value as typeof EFFORTS[number])) {
                updateConfig(updateApertisReasoning(config, {
                  effort: (value || undefined) as typeof reasoning.effort,
                }));
              }
            }}
          >
            {EFFORTS.map(value => (
              <option key={value || "unset"} value={value}>{effortLabel(value)}</option>
            ))}
          </theme.Select>
          <theme.Select
            label={tr("summary")}
            disabled={!reasoningOn}
            values={[reasoning.summary ?? ""]}
            valueTitle={summaryLabel(reasoning.summary ?? "")}
            options={SUMMARIES.map(value => ({ value, label: summaryLabel(value) }))}
            onChange={(value: string) => {
              if (SUMMARIES.includes(value as typeof SUMMARIES[number])) {
                updateConfig(updateApertisReasoning(config, {
                  summary: (value || undefined) as typeof reasoning.summary,
                }));
              }
            }}
          >
            {SUMMARIES.map(value => (
              <option key={value || "unset"} value={value}>{summaryLabel(value)}</option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={tr("compression")}
        headerActions={
          <theme.Switch
            id={`${id}-compression`}
            checked={enabled}
            onChange={value => updateConfig(updateApertisCompression(config, { enabled: value }))}
          />
        }
      >
        <div style={grid}>
          <theme.Select
            label={tr("strategy")}
            disabled={!enabled}
            values={[compression.strategy ?? ""]}
            valueTitle={strategyLabel(compression.strategy ?? "")}
            options={STRATEGIES.map(value => ({ value, label: strategyLabel(value) }))}
            onChange={(value: string) => {
              if (STRATEGIES.includes(value as typeof STRATEGIES[number])) {
                updateConfig(updateApertisCompression(config, {
                  strategy: (value || undefined) as typeof compression.strategy,
                }));
              }
            }}
          >
            {STRATEGIES.map(value => (
              <option key={value || "unset"} value={value}>{strategyLabel(value)}</option>
            ))}
          </theme.Select>
          <theme.Input
            label={tr("threshold")}
            type="number"
            min={0}
            step={1}
            disabled={!enabled}
            placeholder="8000"
            value={compression.threshold ?? ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateInteger("threshold", event.target.value)}
          />
          <theme.Input
            label={tr("keepTurns")}
            type="number"
            min={0}
            step={1}
            disabled={!enabled}
            placeholder="0"
            value={compression.keep_turns ?? ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateInteger("keep_turns", event.target.value)}
          />
          <theme.Input
            label={tr("model")}
            disabled={!enabled}
            placeholder="auto"
            value={compression.model ?? ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateConfig(updateApertisCompression(config, {
              model: event.target.value.trim() || undefined,
            }))}
          />
        </div>
      </theme.Card>
    </div>
  );
};
