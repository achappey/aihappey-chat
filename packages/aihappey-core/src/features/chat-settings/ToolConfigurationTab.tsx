import React, { useMemo } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";
import type { AttachedTool } from "../tools/useTools";
import { namespaceNameForTool } from "../tools/toolRequestConfig";

export type ToolCaller = "direct" | "programmatic";
export type ToolRequestConfig = Record<string, {
  allowed_callers?: ToolCaller[];
  defer_loading?: boolean;
}>;

const CALLERS: ToolCaller[] = ["direct", "programmatic"];

const cleanEntry = (entry: ToolRequestConfig[string]) => {
  const allowed = Array.isArray(entry.allowed_callers)
    ? entry.allowed_callers.filter((value): value is ToolCaller => CALLERS.includes(value as ToolCaller))
    : [];
  return {
    ...(Array.isArray(entry.allowed_callers) ? { allowed_callers: allowed } : {}),
    ...(typeof entry.defer_loading === "boolean" ? { defer_loading: entry.defer_loading } : {}),
  };
};

const sourceDefaults = (tool: AttachedTool): ToolRequestConfig[string] => ({
  ...(Array.isArray(tool.source.requestOptions?.allowed_callers)
    ? { allowed_callers: tool.source.requestOptions.allowed_callers }
    : {}),
  ...(typeof tool.source.requestOptions?.defer_loading === "boolean"
    ? { defer_loading: tool.source.requestOptions.defer_loading }
    : {}),
});

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
      if (useNamespaces || a.source.namespace === true || b.source.namespace === true) {
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
      const clean = cleanEntry({ ...(result[tool.name] ?? sourceDefaults(tool)), ...patch });
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

  const effectiveEntry = (tool: AttachedTool) => config[tool.name] ?? sourceDefaults(tool);
  const allCallerValues = CALLERS.filter((caller) => sortedTools.length > 0 && sortedTools.every((tool) => effectiveEntry(tool).allowed_callers?.includes(caller)));
  const allDeferred = sortedTools.length > 0 && sortedTools.every((tool) => effectiveEntry(tool).defer_loading === true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sortedTools.length > 0 && <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <theme.Switch id="use-tool-namespaces" label={t("toolConfiguration.useNamespaces")} checked={useNamespaces} onChange={onUseNamespacesChange} />
      </div>}
      {sortedTools.length > 0 && <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr>
            <th style={{ textAlign: "left", padding: 8 }}></th>
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
              const entry = effectiveEntry(tool);
              const callers = entry.allowed_callers ?? [];
              const namespace = namespaceNameForTool(tool);
              const namespaceEnabled = useNamespaces || tool.source.namespace === true;
              const previous = index > 0 ? sortedTools[index - 1] : undefined;
              const previousNamespaceEnabled = !!previous && (useNamespaces || previous.source.namespace === true);
              const showNamespace = namespaceEnabled && (!previousNamespaceEnabled || namespaceNameForTool(previous!) !== namespace);
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
                  <td style={{ padding: 8 }}><theme.Switch id={`defer-tool-${tool.name}`} checked={entry.defer_loading === true} onChange={(checked: boolean) => updateTool(tool.name, { ...entry, defer_loading: checked })} /></td>
                </tr>
              </React.Fragment>;
            })}
          </tbody>
        </table>
      </div>
      }
      {!sortedTools.length ? <div style={{ fontSize: 12, opacity: .7 }}>{t("toolConfiguration.empty")}</div> : null}
    </div>
  );
};
