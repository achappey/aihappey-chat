import { useMemo } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { AgentTool, AgentToolCaller } from "aihappey-types";
import {
    getAgentToolConfiguration,
    setAgentToolConfiguration,
    type AgentToolConfiguration,
    type AgentToolIdentity,
} from "./agentToolConfiguration";

const CALLERS: AgentToolCaller[] = ["direct", "programmatic"];

export type ConfigurableAgentTool = {
    key: string;
    label: string;
    source: string;
    identity: AgentToolIdentity;
    defaults?: AgentToolConfiguration;
};

export const AgentToolConfigurationTab = ({
    availableTools,
    tools,
    onChange,
}: {
    availableTools: ConfigurableAgentTool[];
    tools?: AgentTool[];
    onChange: (tools: AgentTool[] | undefined) => void;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const sortedTools = useMemo(
        () => [...availableTools].sort((a, b) => a.label.localeCompare(b.label) || a.source.localeCompare(b.source)),
        [availableTools]
    );

    const explicitEntry = (tool: ConfigurableAgentTool) => getAgentToolConfiguration(tools, tool.identity);
    const effectiveEntry = (tool: ConfigurableAgentTool): AgentToolConfiguration => ({
        ...(tool.defaults ?? {}),
        ...explicitEntry(tool),
    });
    const updateTool = (tool: ConfigurableAgentTool, next: AgentToolConfiguration) =>
        onChange(setAgentToolConfiguration(tools, tool.identity, next));
    const updateAll = (patch: Partial<AgentToolConfiguration>) => {
        let result = tools;
        for (const tool of sortedTools) {
            result = setAgentToolConfiguration(result, tool.identity, {
                ...explicitEntry(tool),
                ...patch,
            });
        }
        onChange(result);
    };

    const callerSelect = (tool: ConfigurableAgentTool | undefined, values: AgentToolCaller[]) => (
        <theme.Select
            multiselect
            values={values}
            valueTitle={values.length
                ? values.map((value) => t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${value}`)).join(", ")
                : ""}
            options={CALLERS.map((value) => ({
                value,
                label: t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${value}`),
            }))}
            onChange={(value: AgentToolCaller) => {
                const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
                if (tool) updateTool(tool, { ...explicitEntry(tool), allowed_callers: next.length ? next : undefined });
                else updateAll({ allowed_callers: next.length ? next : undefined });
            }}
        >
            {CALLERS.map((value) => (
                <option key={value} value={value}>
                    {t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${value}`)}
                </option>
            ))}
        </theme.Select>
    );

    const allCallerValues = CALLERS.filter((caller) =>
        sortedTools.length > 0 && sortedTools.every((tool) => effectiveEntry(tool).allowed_callers?.includes(caller))
    );
    const allDeferred = sortedTools.length > 0
        && sortedTools.every((tool) => effectiveEntry(tool).defer_loading === true);

    if (!sortedTools.length) {
        return <div style={{ fontSize: 12, opacity: .7 }}>{t("toolConfiguration.empty")}</div>;
    }

    return <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead><tr>
                <th style={{ textAlign: "left", padding: 8 }}></th>
                <th style={{ textAlign: "left", padding: 8 }}>{t("toolConfiguration.allowedCallers")}</th>
                <th style={{ textAlign: "left", padding: 8 }}>{t("toolConfiguration.deferLoading")}</th>
            </tr></thead>
            <tbody>
                <tr style={{ borderTop: "1px solid rgba(127,127,127,.25)", borderBottom: "1px solid rgba(127,127,127,.25)" }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{t("toolConfiguration.allTools")}</td>
                    <td style={{ padding: 8 }}>{callerSelect(undefined, allCallerValues)}</td>
                    <td style={{ padding: 8 }}>
                        <theme.Switch
                            id="defer-all-agent-tools"
                            checked={allDeferred}
                            onChange={(checked: boolean) => updateAll({ defer_loading: checked ? true : undefined })}
                        />
                    </td>
                </tr>
                {sortedTools.map((tool) => {
                    const entry = effectiveEntry(tool);
                    return <tr key={tool.key} style={{ borderBottom: "1px solid rgba(127,127,127,.18)" }}>
                        <td style={{ padding: 8, maxWidth: 220, whiteSpace: "normal", overflowWrap: "anywhere" }}>
                            <div style={{ fontWeight: 600, fontSize: "small" }}>{tool.label}</div>
                            <div style={{ fontSize: 11, opacity: .65 }}>{tool.source}</div>
                        </td>
                        <td style={{ padding: 8 }}>{callerSelect(tool, entry.allowed_callers ?? [])}</td>
                        <td style={{ padding: 8 }}>
                            <theme.Switch
                                id={`defer-agent-tool-${tool.key}`}
                                checked={entry.defer_loading === true}
                                onChange={(checked: boolean) => updateTool(tool, {
                                    ...explicitEntry(tool),
                                    defer_loading: checked,
                                })}
                            />
                        </td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;
};
