import { useMemo } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const VENICE_TOOL_TYPES = ["web_search", "x_search"] as const;

const DEFAULT_REASONING = {
  effort: "none",
  summary: "auto",
};

const REASONING_EFFORT_OPTIONS = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

const REASONING_SUMMARY_OPTIONS = ["auto", "concise", "detailed"] as const;

type VeniceParameters = {
  enable_e2ee?: boolean;
  include_venice_system_prompt?: boolean;
  enable_web_search?: "auto" | "on" | "off";
  enable_web_scraping?: boolean;
  enable_web_citations?: boolean;
  include_search_results_in_stream?: boolean;
  return_search_results_as_documents?: boolean;
  strip_thinking_response?: boolean;
  disable_thinking?: boolean;
  character_slug?: string;
  enable_x_search?: boolean;
};

const DEFAULT_VENICE_PARAMETERS: VeniceParameters = {
  enable_e2ee: true,
  include_venice_system_prompt: true,
  enable_web_search: "off",
  enable_web_scraping: false,
  enable_web_citations: false,
  include_search_results_in_stream: false,
  return_search_results_as_documents: false,
  strip_thinking_response: false,
  disable_thinking: false,
  character_slug: undefined,
  enable_x_search: false,
};

const normalizeInteger = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

const VeniceSwitchRow = ({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) => {
  const theme = useTheme();
  return (
    <theme.Switch
      id={label}
      label={label}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
    />
  );
};

export const VeniceChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const resolvedConfig = withResolvedProviderTools(config, VENICE_TOOL_TYPES as any);
  const submitConfig = (nextConfig: any) =>
    updateConfig(buildCanonicalProviderToolsConfig(nextConfig, VENICE_TOOL_TYPES as any));

  const reasoningOn = !!config?.reasoning;
  const veniceParams: VeniceParameters = useMemo(
    () => ({ ...DEFAULT_VENICE_PARAMETERS, ...(config?.venice_parameters ?? {}) }),
    [config?.venice_parameters]
  );

  const setVeniceParameters = (patch: Partial<VeniceParameters>) => {
    submitConfig({
      ...resolvedConfig,
      venice_parameters: {
        ...veniceParams,
        ...patch,
      },
    });
  };

  const toggleTool = (type: (typeof VENICE_TOOL_TYPES)[number], enabled: boolean) => {
    const patch: Record<string, any> = {
      ...resolvedConfig,
      [type]: enabled ? { type } : undefined,
    };

    // Mirror x_search into venice_parameters.enable_x_search when toggled
    if (type === "x_search") {
      patch.venice_parameters = {
        ...veniceParams,
        enable_x_search: !!enabled,
      };
    }

    submitConfig(patch);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Reasoning */}
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="veniceReasoning"
            checked={reasoningOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                reasoning: val ? { ...DEFAULT_REASONING } : undefined,
              })
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:venice.reasoningEffort", "Reasoning effort")}
            disabled={!reasoningOn}
            values={[config?.reasoning?.effort ?? "none"]}
            valueTitle={t(config?.reasoning?.effort ?? "none")}
            options={REASONING_EFFORT_OPTIONS.map((value) => ({
              value,
              label: t(value),
            }))}
            onChange={(value: string) =>
              updateConfig({
                ...config,
                reasoning: {
                  ...(config?.reasoning ?? { ...DEFAULT_REASONING }),
                  effort: value,
                },
              })
            }
          >
            {REASONING_EFFORT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:venice.reasoningSummary", "Reasoning summary")}
            disabled={!reasoningOn}
            values={[config?.reasoning?.summary ?? "auto"]}
            valueTitle={t(config?.reasoning?.summary ?? "auto")}
            options={REASONING_SUMMARY_OPTIONS.map((value) => ({
              value,
              label: t(value),
            }))}
            onChange={(value: string) =>
              updateConfig({
                ...config,
                reasoning: {
                  ...(config?.reasoning ?? { ...DEFAULT_REASONING }),
                  summary: value,
                },
              })
            }
          >
            {REASONING_SUMMARY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      {/* Seed */}
      <theme.Card size="small" title={t("seed", "Seed")}>
        <theme.Input
          label={t("seed", "Seed")}
          type="number"
          value={config?.seed ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              seed: normalizeInteger(e?.target?.value),
            })
          }
          placeholder={t("providers:venice.seedPlaceholder", "Optional seed for reproducibility")}
        />
      </theme.Card>

      {/* Venice parameters */}
      <theme.Card size="small" title={t("providers:venice.title", "Venice settings")}> 
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:venice.webSearchMode", "Web search mode")}
            values={[veniceParams.enable_web_search]}
            valueTitle={t(`providers:venice.webSearchModes.${veniceParams.enable_web_search}`, veniceParams.enable_web_search ?? "off")}
            options={["auto", "on", "off"].map((value) => ({
              value,
              label: t(`providers:venice.webSearchModes.${value}`, value),
            }))}
            onChange={(value: string) => setVeniceParameters({ enable_web_search: value as any })}
          >
            {["auto", "on", "off"].map((value) => (
              <option key={value} value={value}>
                {t(`providers:venice.webSearchModes.${value}`, value)}
              </option>
            ))}
          </theme.Select>

          <theme.Input
            label={t("providers:venice.characterSlug", "Character slug")}
            value={veniceParams.character_slug ?? ""}
            placeholder="venice"
            onChange={(e: any) => setVeniceParameters({ character_slug: e?.target?.value || undefined })}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <VeniceSwitchRow
              label={t("providers:venice.includeSystemPrompt", "Include Venice system prompt")}
              checked={!!veniceParams.include_venice_system_prompt}
              onChange={(val) => setVeniceParameters({ include_venice_system_prompt: val })}
            />
            <VeniceSwitchRow
              label={t("providers:venice.enableE2EE", "Enable E2EE")}
              checked={!!veniceParams.enable_e2ee}
              onChange={(val) => setVeniceParameters({ enable_e2ee: val })}
            />
            <VeniceSwitchRow
              label={t("providers:venice.webCitations", "Enable web citations")}
              checked={!!veniceParams.enable_web_citations}
              onChange={(val) => setVeniceParameters({ enable_web_citations: val })}
            />
            <VeniceSwitchRow
              label={t("providers:venice.webScraping", "Enable web scraping")}
              checked={!!veniceParams.enable_web_scraping}
              onChange={(val) => setVeniceParameters({ enable_web_scraping: val })}
            />
            <VeniceSwitchRow
              label={t("providers:venice.includeSearchResultsInStream", "Include search results in stream")}
              checked={!!veniceParams.include_search_results_in_stream}
              onChange={(val) => setVeniceParameters({ include_search_results_in_stream: val })}
            />
            <VeniceSwitchRow
              label={t("providers:venice.returnSearchResultsAsDocuments", "Return search results as documents")}
              checked={!!veniceParams.return_search_results_as_documents}
              onChange={(val) => setVeniceParameters({ return_search_results_as_documents: val })}
            />
            <VeniceSwitchRow
              label={t("providers:venice.stripThinking", "Strip thinking response")}
              checked={!!veniceParams.strip_thinking_response}
              onChange={(val) => setVeniceParameters({ strip_thinking_response: val })}
            />
            <VeniceSwitchRow
              label={t("providers:venice.disableThinking", "Disable thinking")}
              checked={!!veniceParams.disable_thinking}
              onChange={(val) => setVeniceParameters({ disable_thinking: val })}
            />
          </div>
        </div>
      </theme.Card>

      {/* Web Search tool */}
      <theme.Card
        size="small"
        title={t("webSearch")}
        headerActions={
          <theme.Switch
            id="veniceWebSearchTool"
            checked={!!resolvedConfig?.web_search}
            onChange={(val) => toggleTool("web_search", val)}
          />
        }
      >
        <theme.Text>{t("providers:venice.webSearchDescription", "Enable the Venice web search tool.")}</theme.Text>
      </theme.Card>

      {/* X Search tool */}
      <theme.Card
        size="small"
        title={t("providers:venice.xSearch", "X search")}
        headerActions={
          <theme.Switch
            id="veniceXSearchTool"
            checked={!!resolvedConfig?.x_search}
            onChange={(val) => toggleTool("x_search", val)}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <theme.Text>
            {t("providers:venice.xSearchDescription", "Enable xAI native search (web + X/Twitter)")}
          </theme.Text>
          <VeniceSwitchRow
            label={t("providers:venice.enableXSearchFlag", "Mirror X search to venice parameters")}
            checked={!!veniceParams.enable_x_search}
            onChange={(val) => setVeniceParameters({ enable_x_search: val })}
            disabled={!resolvedConfig?.x_search}
          />
        </div>
      </theme.Card>
    </div>
  );
};

