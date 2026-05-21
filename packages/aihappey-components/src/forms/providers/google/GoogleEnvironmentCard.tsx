import { useTranslation } from "aihappey-i18n";
import { useEffect, useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";

type GoogleEnvironmentSourceType = "repository" | "gcs" | "inline";
type GoogleEnvironmentNetworkMode = "default" | "disabled" | "allowlist";

type GoogleEnvironmentSource = {
  type: GoogleEnvironmentSourceType;
  source?: string;
  content?: string;
  target?: string;
};

type GoogleEnvironmentAllowlistRule = {
  domain?: string;
  transform?: Record<string, string>;
};

const GOOGLE_ENVIRONMENT_SOURCE_TYPES: GoogleEnvironmentSourceType[] = [
  "repository",
  "gcs",
  "inline",
];

const GOOGLE_ENVIRONMENT_NETWORK_MODES: GoogleEnvironmentNetworkMode[] = [
  "default",
  "disabled",
  "allowlist",
];

const DEFAULT_SOURCE: GoogleEnvironmentSource = {
  type: "repository",
  source: "",
  target: "/workspace",
};

const DEFAULT_ALLOWLIST_RULE: GoogleEnvironmentAllowlistRule = {
  domain: "*",
};

const TWO_COLUMN_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const SECTION_STYLE = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
};

const isPlainObject = (value: any) =>
  value && typeof value === "object" && !Array.isArray(value);

const getEnvironmentId = (environment: any) =>
  typeof environment === "string" && environment !== "remote" ? environment : "";

const getSources = (environment: any): GoogleEnvironmentSource[] => {
  if (!isPlainObject(environment) || !Array.isArray(environment.sources)) return [];

  return environment.sources
    .map((source: any) => {
      const type = GOOGLE_ENVIRONMENT_SOURCE_TYPES.includes(source?.type)
        ? source.type
        : "repository";

      return {
        type,
        source: typeof source?.source === "string" ? source.source : "",
        content: typeof source?.content === "string" ? source.content : "",
        target: typeof source?.target === "string" ? source.target : "",
      };
    })
    .filter((source: GoogleEnvironmentSource) => source.type && source.target !== undefined);
};

const getNetworkMode = (environment: any): GoogleEnvironmentNetworkMode => {
  if (!isPlainObject(environment)) return "default";
  if (environment.network === "disabled") return "disabled";
  if (isPlainObject(environment.network)) return "allowlist";
  return "default";
};

const getAllowlist = (environment: any): GoogleEnvironmentAllowlistRule[] => {
  if (!isPlainObject(environment?.network) || !Array.isArray(environment.network.allowlist)) {
    return [];
  }

  return environment.network.allowlist.map((rule: any) => ({
    domain: typeof rule?.domain === "string" ? rule.domain : "",
    transform: isPlainObject(rule?.transform) ? rule.transform : undefined,
  }));
};

const sanitizeSources = (sources: GoogleEnvironmentSource[]) =>
  sources
    .map((source) => {
      const type = GOOGLE_ENVIRONMENT_SOURCE_TYPES.includes(source.type)
        ? source.type
        : "repository";
      const target = String(source.target ?? "").trim();

      if (!target || target === "/") return undefined;

      if (type === "inline") {
        const content = String(source.content ?? "");
        if (!content) return undefined;

        return { type, content, target };
      }

      const sourceValue = String(source.source ?? "").trim();
      if (!sourceValue) return undefined;

      return { type, source: sourceValue, target };
    })
    .filter(Boolean);

const sanitizeTransform = (transform: any) => {
  if (!isPlainObject(transform)) return undefined;

  const entries = Object.entries(transform)
    .map(([key, value]) => [key.trim(), String(value ?? "").trim()])
    .filter(([key, value]) => key && value);

  return entries.length ? Object.fromEntries(entries) : undefined;
};

const sanitizeAllowlist = (allowlist: GoogleEnvironmentAllowlistRule[]) =>
  allowlist
    .map((rule) => {
      const domain = String(rule.domain ?? "").trim();
      if (!domain) return undefined;

      return {
        domain,
        ...(sanitizeTransform(rule.transform) ? { transform: sanitizeTransform(rule.transform) } : {}),
      };
    })
    .filter(Boolean);

const buildNetwork = (
  mode: GoogleEnvironmentNetworkMode,
  allowlist: GoogleEnvironmentAllowlistRule[]
) => {
  if (mode === "default") return undefined;
  if (mode === "disabled") return "disabled";

  const nextAllowlist = sanitizeAllowlist(allowlist);
  if (!nextAllowlist.length) return undefined;

  return {
    allowlist: nextAllowlist,
  };
};

const buildEnvironment = ({
  enabled,
  environmentId,
  sources,
  networkMode,
  allowlist,
}: {
  enabled: boolean;
  environmentId: string;
  sources: GoogleEnvironmentSource[];
  networkMode: GoogleEnvironmentNetworkMode;
  allowlist: GoogleEnvironmentAllowlistRule[];
}) => {
  if (!enabled) return undefined;

  const trimmedEnvironmentId = environmentId.trim();
  if (trimmedEnvironmentId) return trimmedEnvironmentId;

  const nextSources = sanitizeSources(sources);
  const nextNetwork = buildNetwork(networkMode, allowlist);

  if (!nextSources.length && !nextNetwork) return "remote";

  return {
    type: "remote",
    ...(nextSources.length ? { sources: nextSources } : {}),
    ...(nextNetwork ? { network: nextNetwork } : {}),
  };
};

const parseTransformDraft = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed);
    return isPlainObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const formatTransformDraft = (transform: any) =>
  isPlainObject(transform) ? JSON.stringify(transform, null, 2) : "";

export const GoogleEnvironmentCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const environmentEnabled =
    config?.environment !== undefined &&
    config?.environment !== null &&
    config?.environment !== false;
  const environmentId = getEnvironmentId(config?.environment);
  const environmentIdOn = !!environmentId.trim();
  const sources = getSources(config?.environment);
  const networkMode = getNetworkMode(config?.environment);
  const allowlist = getAllowlist(config?.environment);
  const [sourceDrafts, setSourceDrafts] = useState<GoogleEnvironmentSource[]>(sources);
  const [networkModeDraft, setNetworkModeDraft] =
    useState<GoogleEnvironmentNetworkMode>(networkMode);
  const [allowlistDrafts, setAllowlistDrafts] =
    useState<GoogleEnvironmentAllowlistRule[]>(allowlist);
  const sourceTypeOptions = GOOGLE_ENVIRONMENT_SOURCE_TYPES.map((value) => ({
    value,
    label: t(`providers:google.environment.sourceTypes.${value}`),
  }));
  const networkModeOptions = GOOGLE_ENVIRONMENT_NETWORK_MODES.map((value) => ({
    value,
    label: t(`providers:google.environment.networkModes.${value}`),
  }));

  useEffect(() => {
    if (!environmentEnabled || environmentIdOn) {
      setSourceDrafts([]);
      setNetworkModeDraft("default");
      setAllowlistDrafts([]);
      return;
    }

    if (sources.length) setSourceDrafts(sources);
    if (networkMode !== "default") setNetworkModeDraft(networkMode);
    if (allowlist.length) setAllowlistDrafts(allowlist);
  }, [config?.environment]);

  const setEnvironment = (nextEnvironment: any) =>
    updateConfig({
      ...config,
      environment: nextEnvironment,
    });

  const updateEnvironment = (next: {
    enabled?: boolean;
    environmentId?: string;
    sources?: GoogleEnvironmentSource[];
    networkMode?: GoogleEnvironmentNetworkMode;
    allowlist?: GoogleEnvironmentAllowlistRule[];
  }) =>
    setEnvironment(
      buildEnvironment({
        enabled: next.enabled ?? environmentEnabled,
        environmentId: next.environmentId ?? environmentId,
        sources: next.sources ?? sourceDrafts,
        networkMode: next.networkMode ?? networkModeDraft,
        allowlist: next.allowlist ?? allowlistDrafts,
      })
    );

  const updateSources = (nextSources: GoogleEnvironmentSource[]) => {
    setSourceDrafts(nextSources);
    updateEnvironment({ sources: nextSources });
  };

  const updateNetworkMode = (nextNetworkMode: GoogleEnvironmentNetworkMode) => {
    const nextAllowlist =
      nextNetworkMode === "allowlist" && !allowlistDrafts.length
        ? [{ ...DEFAULT_ALLOWLIST_RULE }]
        : allowlistDrafts;

    setNetworkModeDraft(nextNetworkMode);
    setAllowlistDrafts(nextAllowlist);
    updateEnvironment({ networkMode: nextNetworkMode, allowlist: nextAllowlist });
  };

  const updateAllowlist = (nextAllowlist: GoogleEnvironmentAllowlistRule[]) => {
    setAllowlistDrafts(nextAllowlist);
    updateEnvironment({ allowlist: nextAllowlist });
  };

  return (
    <theme.Card
      size="small"
      title={t("providers:google.environment.title")}
      headerActions={
        <theme.Switch
          id="google-environment"
          checked={environmentEnabled}
          onChange={(checked: boolean) =>
            updateEnvironment({
              enabled: checked,
              environmentId: checked ? environmentId : "",
              sources: checked ? sourceDrafts : [],
              networkMode: checked ? networkModeDraft : "default",
              allowlist: checked ? allowlistDrafts : [],
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <theme.Input
          label={t("providers:google.environment.environmentId")}
          placeholder="env_abc123"
          disabled={!environmentEnabled}
          value={environmentId}
          onChange={(e: any) =>
            updateEnvironment({
              environmentId: String(e?.target?.value ?? ""),
              sources: [],
              networkMode: "default",
              allowlist: [],
            })
          }
        />

        <div style={SECTION_STYLE}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong>{t("providers:google.environment.sources")}</strong>
            <theme.Button
              type="button"
              icon="add"
              size="small"
              variant="subtle"
              title={t("providers:google.environment.addSource")}
              disabled={!environmentEnabled || environmentIdOn}
              onClick={() => updateSources([...sourceDrafts, { ...DEFAULT_SOURCE }])}
            >
              {t("providers:google.environment.addSource")}
            </theme.Button>
          </div>

          {sourceDrafts.length > 0 && (
            sourceDrafts.map((source, index) => (
              <div
                key={`google-environment-source-${index}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={TWO_COLUMN_GRID}>
                  <theme.Select
                    label={t("providers:google.environment.sourceType")}
                    disabled={!environmentEnabled || environmentIdOn}
                    values={[source.type]}
                    valueTitle={
                      sourceTypeOptions.find((option) => option.value === source.type)?.label
                    }
                    options={sourceTypeOptions}
                    onChange={(value: string) => {
                      const nextSources = [...sourceDrafts];
                      nextSources[index] = {
                        ...nextSources[index],
                        type: value as GoogleEnvironmentSourceType,
                        source: value === "inline" ? undefined : nextSources[index]?.source ?? "",
                        content: value === "inline" ? nextSources[index]?.content ?? "" : undefined,
                      };
                      updateSources(nextSources);
                    }}
                  >
                    {sourceTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </theme.Select>

                  <theme.Input
                    label={t("providers:google.environment.target")}
                    placeholder="/workspace/project"
                    disabled={!environmentEnabled || environmentIdOn}
                    value={source.target ?? ""}
                    onChange={(e: any) => {
                      const nextSources = [...sourceDrafts];
                      nextSources[index] = {
                        ...nextSources[index],
                        target: String(e?.target?.value ?? ""),
                      };
                      updateSources(nextSources);
                    }}
                  />
                </div>

                {source.type === "inline" ? (
                  <theme.TextArea
                    label={t("providers:google.environment.inlineContent")}
                    rows={4}
                    readOnly={!environmentEnabled || environmentIdOn}
                    value={source.content ?? ""}
                    onChange={(value: string) => {
                      const nextSources = [...sourceDrafts];
                      nextSources[index] = {
                        ...nextSources[index],
                        content: value,
                      };
                      updateSources(nextSources);
                    }}
                  />
                ) : (
                  <theme.Input
                    label={t("providers:google.environment.source")}
                    placeholder={
                      source.type === "gcs"
                        ? "gs://bucket/path"
                        : "https://github.com/octocat/Spoon-Knife"
                    }
                    disabled={!environmentEnabled || environmentIdOn}
                    value={source.source ?? ""}
                    onChange={(e: any) => {
                      const nextSources = [...sourceDrafts];
                      nextSources[index] = {
                        ...nextSources[index],
                        source: String(e?.target?.value ?? ""),
                      };
                      updateSources(nextSources);
                    }}
                  />
                )}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <theme.Button
                    type="button"
                    icon="delete"
                    size="small"
                    variant="danger"
                    title={t("delete")}
                    disabled={!environmentEnabled || environmentIdOn}
                    onClick={() =>
                      updateSources(
                        sourceDrafts.filter((_, sourceIndex) => sourceIndex !== index)
                      )
                    }
                  >
                    {t("delete")}
                  </theme.Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={SECTION_STYLE}>
          <strong>{t("providers:google.environment.network")}</strong>

          <theme.Select
            label={t("providers:google.environment.networkMode")}
            disabled={!environmentEnabled || environmentIdOn}
            values={[networkModeDraft]}
            valueTitle={
              networkModeOptions.find((option) => option.value === networkModeDraft)?.label
            }
            options={networkModeOptions}
            onChange={(value: string) => updateNetworkMode(value as GoogleEnvironmentNetworkMode)}
          >
            {networkModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </theme.Select>

          {networkModeDraft === "allowlist" && (
            <div style={SECTION_STYLE}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.78 }}>
                  {t("providers:google.environment.allowlistHelp")}
                </div>
                <theme.Button
                  type="button"
                  icon="add"
                  size="small"
                  variant="subtle"
                  title={t("providers:google.environment.addAllowlistRule")}
                  disabled={!environmentEnabled || environmentIdOn}
                  onClick={() =>
                    updateAllowlist([...allowlistDrafts, { ...DEFAULT_ALLOWLIST_RULE }])
                  }
                >
                  {t("providers:google.environment.addAllowlistRule")}
                </theme.Button>
              </div>

              {allowlistDrafts.map((rule, index) => (
                <div
                  key={`google-environment-allowlist-${index}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 10,
                    padding: 10,
                  }}
                >
                  <theme.Input
                    label={t("providers:google.environment.domain")}
                    placeholder="api.github.com"
                    disabled={!environmentEnabled || environmentIdOn}
                    value={rule.domain ?? ""}
                    onChange={(e: any) => {
                      const nextAllowlist = [...allowlistDrafts];
                      nextAllowlist[index] = {
                        ...nextAllowlist[index],
                        domain: String(e?.target?.value ?? ""),
                      };
                      updateAllowlist(nextAllowlist);
                    }}
                  />

                  <theme.TextArea
                    label={t("providers:google.environment.transform")}
                    placeholder={'{"Authorization":"Bearer token"}'}
                    rows={3}
                    readOnly={!environmentEnabled || environmentIdOn}
                    value={formatTransformDraft(rule.transform)}
                    onChange={(value: string) => {
                      const nextAllowlist = [...allowlistDrafts];
                      nextAllowlist[index] = {
                        ...nextAllowlist[index],
                        transform: parseTransformDraft(value),
                      };
                      updateAllowlist(nextAllowlist);
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <theme.Button
                      type="button"
                      icon="delete"
                      size="small"
                      variant="danger"
                      title={t("delete")}
                      disabled={!environmentEnabled || environmentIdOn}
                      onClick={() =>
                        updateAllowlist(
                          allowlistDrafts.filter((_, ruleIndex) => ruleIndex !== index)
                        )
                      }
                    >
                      {t("delete")}
                    </theme.Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </theme.Card>
  );
};

