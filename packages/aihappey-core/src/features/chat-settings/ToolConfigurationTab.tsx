import React, { useMemo } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";
import type { AttachedTool } from "../tools/useTools";
import { namespaceNameForTool } from "../tools/toolRequestConfig";

export type ToolCaller = "direct" | "programmatic";
export type ToolRequestConfig = Record<string, {
  allowed_callers?: ToolCaller[];
  defer_loading?: true;
}>;

const CALLERS: ToolCaller[] = ["direct", "programmatic"];

const cleanEntry = (entry: ToolRequestConfig[string]) => {
  const allowed = Array.isArray(entry.allowed_callers)
    ? entry.allowed_callers.filter((value): value is ToolCaller => CALLERS.includes(value as ToolCaller))
    : [];
  return {
    ...(allowed.length ? { allowed_callers: allowed } : {}),
    ...(entry.defer_loading ? { defer_loading: true as const } : {}),
  };
};

export const ToolConfigurationTab = ({
  tools,
  config,
  useNamespaces,
  onConfigChange,
  onUseNamespacesChange,
}: {
  tools: AttachedTool[];
  config: ToolRequestConfig;
  useNamespaces: boolean;
  onConfigChange: (config: ToolRequestConfig) => void;
  onUseNamespacesChange: (enabled: boolean) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const sortedTools = useMemo(
    () => [...tools].sort((a, b) => {
      if (useNamespaces) {
        const byNamespace = namespaceNameForTool(a).localeCompare(namespaceNameForTool(b));
        if (byNamespace) return byNamespace;
      }
      return a.name.localeCompare(b.name);
    }),
    [tools, useNamespaces]
  );

  const updateTool = (name: string, next: ToolRequestConfig[string]) => {
    const clean = cleanEntry(next);
    const result = { ...config };
    if (Object.keys(clean).length) result[name] = clean;
    else delete result[name];
    onConfigChange(result);
  };

  const updateAll = (patch: Partial<ToolRequestConfig[string]>) => {
    const result = { ...config };
    for (const tool of sortedTools) {
      const clean = cleanEntry({ ...(result[tool.name] ?? {}), ...patch });
      if (Object.keys(clean).length) result[tool.name] = clean;
      else delete result[tool.name];
    }
    onConfigChange(result);
  };

  const callerSelect = (name: string, values: ToolCaller[], bulk = false) => (
    <theme.Select
      multiselect
      values={values}
      valueTitle={values.length ? values.map((v) => t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${v}`)).join(", ") : ""}
      options={CALLERS.map((value) => ({
        value,
        label: t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${value}`),
      }))}
      onChange={(value: ToolCaller) => {
        const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
        if (bulk) updateAll({ allowed_callers: next.length ? next : undefined });
        else updateTool(name, { ...(config[name] ?? {}), allowed_callers: next.length ? next : undefined });
      }}
    >
      {CALLERS.map((value) => <option key={value} value={value}>{t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${value}`)}</option>)}
    </theme.Select>
  );

  const allCallerValues = CALLERS.filter((caller) => sortedTools.length > 0 && sortedTools.every((tool) => config[tool.name]?.allowed_callers?.includes(caller)));
  const allDeferred = sortedTools.length > 0 && sortedTools.every((tool) => config[tool.name]?.defer_loading);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <theme.Switch id="use-tool-namespaces" label={t("toolConfiguration.useNamespaces")} checked={useNamespaces} onChange={onUseNamespacesChange} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr>
            <th style={{ textAlign: "left", padding: 8 }}>{t("toolConfiguration.name")}</th>
            <th style={{ textAlign: "left", padding: 8 }}>{t("toolConfiguration.allowedCallers")}</th>
            <th style={{ textAlign: "left", padding: 8 }}>{t("toolConfiguration.deferLoading")}</th>
          </tr></thead>
          <tbody>
            <tr style={{ borderTop: "1px solid rgba(127,127,127,.25)", borderBottom: "1px solid rgba(127,127,127,.25)" }}>
              <td style={{ padding: 8, fontWeight: 600 }}>{t("toolConfiguration.allTools")}</td>
              <td style={{ padding: 8 }}>{callerSelect("", allCallerValues, true)}</td>
              <td style={{ padding: 8 }}><theme.Switch id="defer-all-tools" checked={allDeferred} onChange={(checked: boolean) => updateAll({ defer_loading: checked ? true : undefined })} /></td>
            </tr>
            {sortedTools.map((tool, index) => {
              const entry = config[tool.name] ?? {};
              const callers = entry.allowed_callers ?? [];
              const namespace = namespaceNameForTool(tool);
              const showNamespace = useNamespaces && (index === 0 || namespaceNameForTool(sortedTools[index - 1]) !== namespace);
              return <React.Fragment key={tool.name}>
                {showNamespace ? <tr><td colSpan={3} style={{ padding: "12px 8px 6px", fontWeight: 700, opacity: .8 }}>{t("toolConfiguration.namespace")}: {namespace}</td></tr> : null}
                <tr style={{ borderBottom: "1px solid rgba(127,127,127,.18)" }}>
                  <td style={{
                    padding: 8,
                    maxWidth: 200,
                    whiteSpace: "normal",
                    overflowWrap: "anywhere"

                  }}><div style={{
                    fontWeight: 600,
                    fontSize: "small",

                  }}>{tool.name}</div>
                    <div style={{ fontSize: 11, opacity: .65 }}>{tool.source.name}</div></td>
                  <td style={{ padding: 8 }}>{callerSelect(tool.name, callers)}</td>
                  <td style={{ padding: 8 }}><theme.Switch id={`defer-tool-${tool.name}`} checked={!!entry.defer_loading} onChange={(checked: boolean) => updateTool(tool.name, { ...entry, defer_loading: checked ? true : undefined })} /></td>
                </tr>
              </React.Fragment>;
            })}
          </tbody>
        </table>
      </div>
      {!sortedTools.length ? <div style={{ fontSize: 12, opacity: .7 }}>{t("toolConfiguration.empty")}</div> : null}
    </div>
  );
};
