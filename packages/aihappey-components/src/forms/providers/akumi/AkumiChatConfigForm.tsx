import { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

export type AkumiChatConfig = {
  parallel_tool_calls?: boolean;
  cache?: boolean;
  tags?: string[];
  firewall?: boolean;
  firewall_language?: "auto" | "nl" | "en" | "fr" | "de";
  [key: string]: unknown;
};

const LANGUAGES = ["auto", "nl", "en", "fr", "de"] as const;

export const AkumiChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: AkumiChatConfig;
  updateConfig: (value: AkumiChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [draftTag, setDraftTag] = useState("");
  const tags = Array.isArray(config?.tags) ? config.tags : [];
  const tag = draftTag.trim();
  const canAddTag = !!tag && tag.length <= 64 && tags.length < 10;
  const firewallIncluded = config?.firewall !== undefined || config?.firewall_language !== undefined;
  const language = LANGUAGES.includes(config?.firewall_language as typeof LANGUAGES[number])
    ? config.firewall_language!
    : "auto";

  const updateTags = (nextTags: string[]) => {
    const next = { ...(config ?? {}) };
    if (nextTags.length) next.tags = nextTags;
    else delete next.tags;
    updateConfig(next);
  };

  const addTag = () => {
    if (!canAddTag) return;
    updateTags([...tags, tag]);
    setDraftTag("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("providers:akumi.tags", "Tags")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <theme.Input
                id="akumiTag"
                label={t("providers:akumi.tag", "New tag")}
                value={draftTag}
                maxLength={64}
                disabled={tags.length >= 10}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraftTag(event.target.value)}
                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
              />
            </div>
            <theme.Button type="button" icon="add" size="small" variant="informative" title={t("add")} disabled={!canAddTag} onClick={addTag}>
              {t("add")}
            </theme.Button>
          </div>
          {tags.map((value, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{value}</span>
              <theme.Button
                type="button"
                icon="delete"
                size="small"
                variant="danger"
                title={`${t("delete")}: ${value}`}
                onClick={() => updateTags(tags.filter((_, itemIndex) => itemIndex !== index))}
              />
            </div>
          ))}
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:akumi.firewall", "Firewall")}
        headerActions={
          <>
            <label htmlFor="akumiSendFirewall" style={{ position: "absolute", width: 1, height: 1, padding: 0, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap" }}>
              {t("providers:akumi.sendFirewall", "Send firewall settings")}
            </label>
            <theme.Switch
              id="akumiSendFirewall"
              checked={firewallIncluded}
              onChange={(enabled: boolean) => {
                const next = { ...(config ?? {}) };
                if (enabled) {
                  next.firewall = true;
                  next.firewall_language = "auto";
                } else {
                  delete next.firewall;
                  delete next.firewall_language;
                }
                updateConfig(next);
              }}
            />
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Switch
            id="akumiFirewall"
            label={t("providers:akumi.firewallEnabled", "EU routing")}
            disabled={!firewallIncluded}
            checked={config?.firewall !== false}
            onChange={(value: boolean) => updateConfig({ ...config, firewall: value, firewall_language: language })}
          />
          <theme.Select
            label={t("providers:akumi.firewallLanguage", "Analysis language")}
            disabled={!firewallIncluded}
            values={[language]}
            valueTitle={t(`providers:akumi.languages.${language}`, language)}
            options={LANGUAGES.map((value) => ({ value, label: t(`providers:akumi.languages.${value}`, value) }))}
            onChange={(value: string) => {
              if (LANGUAGES.includes(value as typeof LANGUAGES[number])) {
                updateConfig({ ...config, firewall: config?.firewall !== false, firewall_language: value as typeof LANGUAGES[number] });
              }
            }}
          >
            {LANGUAGES.map((value) => <option key={value} value={value}>{t(`providers:akumi.languages.${value}`, value)}</option>)}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:akumi.other", "Other")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Switch
            id="akumiParallelToolCalls"
            label={t("parallelToolCalls")}
            checked={config?.parallel_tool_calls === true}
            onChange={(value: boolean) => updateConfig({ ...config, parallel_tool_calls: value })}
          />
          <theme.Switch
            id="akumiCache"
            label={t("providers:akumi.cache", "Cache")}
            checked={config?.cache !== false}
            onChange={(value: boolean) => updateConfig({ ...config, cache: value })}
          />
        </div>
      </theme.Card>
    </div>
  );
};
