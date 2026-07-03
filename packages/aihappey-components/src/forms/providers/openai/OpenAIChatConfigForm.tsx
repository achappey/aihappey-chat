import { useMemo, useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { OpenAIReasoningForm } from "./cards/OpenAIReasoningForm";
import { OpenAIWebSearchForm } from "./cards/OpenAIWebSearchForm";
import { OpenAIImageGenerationForm } from "./cards/OpenAIImageGenerationForm";
import { OpenAICodeInterpreterForm } from "./cards/OpenAICodeInterpreterForm";
import { OpenAIFileSearchForm } from "./cards/OpenAIFileSearchForm";
import {
  OpenAIShellForm,
  type OpenAISkillOption,
  type ResolveOpenAIShellSkill,
} from "./cards/OpenAIShellForm";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const OPENAI_TOOL_TYPES = [
  "web_search",
  "image_generation",
  "code_interpreter",
  "file_search",
  "shell",
];

const IMAGE_INPUT_DETAIL_OPTIONS = ["auto", "low", "high", "original"] as const;
const CONTEXT_MANAGEMENT_TYPE_OPTIONS = ["compaction"] as const;
const MIN_COMPACT_THRESHOLD = 1000;

type OpenAIContextManagementEntry = {
  type?: string;
  compact_threshold?: number;
};

const createContextManagementEntry = (): OpenAIContextManagementEntry => ({
  type: "compaction",
  compact_threshold: MIN_COMPACT_THRESHOLD,
});

const normalizeThresholdInput = (value: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const OpenAIChatConfigForm = ({
  config,
  updateConfig,
  openAISkillOptions = [],
  resolveOpenAIShellSkill,
}: {
  config: any;
  updateConfig: (val: any) => void;
  openAISkillOptions?: OpenAISkillOption[];
  resolveOpenAIShellSkill?: ResolveOpenAIShellSkill;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedConfig = withResolvedProviderTools(config, OPENAI_TOOL_TYPES);
  const submitConfig = (nextConfig: any) =>
    updateConfig(
      buildCanonicalProviderToolsConfig(nextConfig, OPENAI_TOOL_TYPES)
    );
  const serviceTierOptions = ["auto", "default", "flex", "scale", "priority"];
  const serviceTierValue = resolvedConfig?.service_tier ?? "auto";
  const truncationOptions = ["auto", "disabled"];
  const truncationEnabled = resolvedConfig?.truncation != null;
  const truncationValue = truncationEnabled ? resolvedConfig.truncation : "auto";
  const imageInputDetailValue = resolvedConfig?.inputImageDetail ?? "auto";
  const contextManagement = useMemo(
    () =>
      Array.isArray(resolvedConfig?.context_management)
        ? resolvedConfig.context_management
        : [],
    [resolvedConfig?.context_management]
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftType, setDraftType] = useState<string>("compaction");
  const [draftThreshold, setDraftThreshold] = useState<string>(String(MIN_COMPACT_THRESHOLD));
  const thresholdNumber = normalizeThresholdInput(draftThreshold);
  const thresholdValid =
    typeof thresholdNumber === "number" && thresholdNumber >= MIN_COMPACT_THRESHOLD;

  const updateContextManagement = (nextEntries: OpenAIContextManagementEntry[]) =>
    submitConfig({
      ...resolvedConfig,
      context_management: nextEntries.length > 0 ? nextEntries : undefined,
    });

  const omitTruncation = (nextConfig: any) => {
    const { truncation: _truncation, ...rest } = nextConfig ?? {};
    return rest;
  };

  const updateTruncationEnabled = (enabled: boolean) => {
    if (enabled) {
      submitConfig({
        ...resolvedConfig,
        truncation: resolvedConfig?.truncation ?? "auto",
      });
      return;
    }

    submitConfig(omitTruncation(resolvedConfig));
  };

  const startContextManagementEdit = (
    index: number,
    entry: OpenAIContextManagementEntry
  ) => {
    setEditingIndex(index);
    setDraftType(entry?.type || "compaction");
    setDraftThreshold(
      entry?.compact_threshold != null
        ? String(entry.compact_threshold)
        : String(MIN_COMPACT_THRESHOLD)
    );
  };

  const cancelContextManagementEdit = () => {
    setEditingIndex(null);
    setDraftType("compaction");
    setDraftThreshold(String(MIN_COMPACT_THRESHOLD));
  };

  const saveContextManagementEdit = () => {
    if (editingIndex === null || !thresholdValid) return;

    const nextEntries = [...contextManagement];
    nextEntries[editingIndex] = {
      type: draftType,
      compact_threshold: thresholdNumber,
    };
    updateContextManagement(nextEntries);
    cancelContextManagementEdit();
  };

  const moveContextManagementEntry = (from: number, to: number) => {
    if (to < 0 || to >= contextManagement.length || from === to) return;

    const nextEntries = [...contextManagement];
    const [moved] = nextEntries.splice(from, 1);
    nextEntries.splice(to, 0, moved);
    updateContextManagement(nextEntries);

    if (editingIndex === from) {
      setEditingIndex(to);
    } else if (editingIndex === to) {
      setEditingIndex(from);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <OpenAIReasoningForm config={resolvedConfig} updateConfig={submitConfig} />
      <OpenAIWebSearchForm config={resolvedConfig} updateConfig={submitConfig} />
      <OpenAIImageGenerationForm
        config={resolvedConfig}
        updateConfig={submitConfig}
      />
      <OpenAICodeInterpreterForm
        config={resolvedConfig}
        updateConfig={submitConfig}
      />
      <OpenAIShellForm
        config={resolvedConfig}
        updateConfig={submitConfig}
        openAISkillOptions={openAISkillOptions}
        resolveOpenAIShellSkill={resolveOpenAIShellSkill}
      />
      <OpenAIFileSearchForm
        config={resolvedConfig}
        updateConfig={submitConfig}
      />

      <theme.Card title={t("providers:openai.contextManagement.title")} size="small">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.78 }}>
            {t("providers:openai.contextManagement.description")}
          </div>

          {contextManagement.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.72 }}>
              {t("providers:openai.contextManagement.empty")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {contextManagement.map((entry: OpenAIContextManagementEntry, index: number) => {
                const isEditing = editingIndex === index;

                return (
                  <div
                    key={`context-management-${index}`}
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontWeight: 600 }}>
                          {t(`providers:openai.contextManagement.types.${entry?.type || "compaction"}`)}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.72 }}>
                          {t("providers:openai.contextManagement.entrySummary", {
                            threshold: entry?.compact_threshold ?? MIN_COMPACT_THRESHOLD,
                          })}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <theme.Button
                          icon="up"
                          size="small"
                          variant="subtle"
                          title={t("up")}
                          disabled={index === 0}
                          onClick={() => moveContextManagementEntry(index, index - 1)}
                        />
                        <theme.Button
                          icon="down"
                          size="small"
                          variant="subtle"
                          title={t("down")}
                          disabled={index === contextManagement.length - 1}
                          onClick={() => moveContextManagementEntry(index, index + 1)}
                        />
                        <theme.Button
                          icon="edit"
                          size="small"
                          variant="subtle"
                          title={t("edit")}
                          onClick={() => startContextManagementEdit(index, entry)}
                        />
                        <theme.Button
                          icon="delete"
                          size="small"
                          variant="danger"
                          title={t("delete")}
                          onClick={() => {
                            const nextEntries = contextManagement.filter((_: unknown, i: number) => i !== index);
                            updateContextManagement(nextEntries);
                            if (editingIndex === index) {
                              cancelContextManagementEdit();
                            } else if (editingIndex != null && editingIndex > index) {
                              setEditingIndex(editingIndex - 1);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {isEditing ? (
                      <div
                        style={{
                          paddingTop: 10,
                          borderTop: "1px solid rgba(0,0,0,0.06)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <theme.Select
                          label={t("providers:openai.contextManagement.type")}
                          values={[draftType]}
                          valueTitle={t(`providers:openai.contextManagement.types.${draftType}`)}
                          options={CONTEXT_MANAGEMENT_TYPE_OPTIONS.map((value) => ({
                            value,
                            label: t(`providers:openai.contextManagement.types.${value}`),
                          }))}
                          onChange={(value: string) => setDraftType(String(value ?? "compaction"))}
                        >
                          {CONTEXT_MANAGEMENT_TYPE_OPTIONS.map((value) => (
                            <option key={value} value={value}>
                              {t(`providers:openai.contextManagement.types.${value}`)}
                            </option>
                          ))}
                        </theme.Select>

                        <theme.Input
                          label={t("providers:openai.contextManagement.compactThreshold")}
                          type="number"
                          value={draftThreshold}
                          onChange={(e: any) => setDraftThreshold(String(e?.target?.value ?? ""))}
                          placeholder={String(MIN_COMPACT_THRESHOLD)}
                        />

                        <div style={{ fontSize: 12, opacity: 0.72 }}>
                          {thresholdValid
                            ? t("providers:openai.contextManagement.compactThresholdHelp")
                            : t("providers:openai.contextManagement.compactThresholdInvalid", {
                                min: MIN_COMPACT_THRESHOLD,
                              })}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <theme.Button
                            size="small"
                            variant="subtle"
                            title={t("cancel")}
                            onClick={cancelContextManagementEdit}
                          >
                            {t("cancel")}
                          </theme.Button>
                          <theme.Button
                            icon="check"
                            size="small"
                            variant="informative"
                            title={t("save")}
                            disabled={!thresholdValid}
                            onClick={saveContextManagementEdit}
                          >
                            {t("save")}
                          </theme.Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <theme.Button
              icon="add"
              size="small"
              variant="subtle"
              title={t("providers:openai.contextManagement.add")}
              onClick={() => {
                const nextEntries = [...contextManagement, createContextManagementEntry()];
                updateContextManagement(nextEntries);
                startContextManagementEdit(nextEntries.length - 1, nextEntries[nextEntries.length - 1]);
              }}
            >
              {t("providers:openai.contextManagement.add")}
            </theme.Button>
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:openai.truncation.title")}
        headerActions={
          <theme.Switch
            id="openai-truncation-enabled"
            checked={truncationEnabled}
            onChange={updateTruncationEnabled}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:openai.truncation.title")}
            values={[truncationValue]}
            valueTitle={t(`providers:openai.truncation.${truncationValue}`)}
            disabled={!truncationEnabled}
            options={truncationOptions.map((value) => ({
              value,
              label: t(`providers:openai.truncation.${value}`),
            }))}
            onChange={(value: string) => {
              if (!truncationEnabled) return;

              submitConfig({
                ...resolvedConfig,
                truncation: String(value ?? "auto"),
              });
            }}
          >
            {truncationOptions.map((value) => (
              <option key={value} value={value}>
                {t(`providers:openai.truncation.${value}`)}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("other")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <theme.Select
            label={t("providers:openai.imageInputDetail.title")}
            values={[imageInputDetailValue]}
            valueTitle={t(`providers:openai.imageInputDetail.${imageInputDetailValue}`)}
            options={IMAGE_INPUT_DETAIL_OPTIONS.map((value) => ({
              value,
              label: t(`providers:openai.imageInputDetail.${value}`),
            }))}
            onChange={(value: string) =>
              submitConfig({
                ...resolvedConfig,
                inputImageDetail: String(value ?? "auto"),
              })
            }
          >
            {IMAGE_INPUT_DETAIL_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`providers:openai.imageInputDetail.${value}`)}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:openai.serviceTier.title")}
            values={[serviceTierValue]}
            valueTitle={t(`providers:openai.serviceTier.${serviceTierValue}`)}
            options={serviceTierOptions.map((value) => ({
              value,
              label: t(`providers:openai.serviceTier.${value}`),
            }))}
            onChange={(value: string) =>
              submitConfig({
                ...resolvedConfig,
                service_tier: String(value ?? "auto"),
              })
            }
          >
            {serviceTierOptions.map((value) => (
              <option key={value} value={value}>
                {t(`providers:openai.serviceTier.${value}`)}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="parallelToolCalls"
            checked={!!resolvedConfig?.parallel_tool_calls}
            label={t("parallelToolCalls")}
            onChange={(value) =>
              submitConfig({
                ...resolvedConfig,
                parallel_tool_calls: value,
              })
            }
          />


        </div>
      </theme.Card>

      <theme.TextArea
        label={t("providers:openai.instructions")}
        placeholder={t(
          "providers:openai.instructionsPlaceholder"
        )}
        rows={5}
        value={resolvedConfig?.instructions}
        onChange={(value) =>
          submitConfig({
            ...resolvedConfig,
            instructions: value,
          })
        }
      />
    </div>
  );
};
