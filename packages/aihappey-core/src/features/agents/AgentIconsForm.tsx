import { useState, type Dispatch, type SetStateAction } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { Agent } from "aihappey-types";
import { addAgentIcon, removeAgentIcon, updateAgentIcon } from "./agentIcons";

export const AgentIconsForm = ({ agent, onChange }: {
    agent: Agent;
    onChange: Dispatch<SetStateAction<Agent>>;
}) => {
    const { Input, Select, Button, Card } = useTheme();
    const { t } = useTranslation();
    const [src, setSrc] = useState("");
    const [theme, setTheme] = useState("");
    const themeOptions = [
        { value: "", label: t("agentEdit.iconThemeAny") },
        { value: "light", label: t("agentEdit.iconThemeLight") },
        { value: "dark", label: t("agentEdit.iconThemeDark") },
    ];
    const themeSelect = (value: string, change: (value: string) => void) => <Select
        label={t("agentEdit.iconTheme")}
        values={[value]}
        valueTitle={themeOptions.find(option => option.value === value)?.label ?? value}
        onChange={change}
    >
        {themeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </Select>;
    const add = () => {
        if (!src.trim()) return;
        onChange(current => addAgentIcon(current, src, theme));
        setSrc(""); setTheme("");
    };

    return <div style={{ marginTop: 16 }}>
        <Card title={t("agentEdit.icons")} size="small">
            <div style={{ display: "grid", gap: 16 }}>
                {(agent.icons ?? []).map((icon, index) => <div key={index} style={{ display: "grid", gap: 8, minWidth: 0 }}>
                    <Input label={t("agentEdit.iconUrl")} type="url" value={icon.src}
                        onChange={event => onChange(current => updateAgentIcon(current, index, { src: event.target.value }))} />
                    {themeSelect(icon.theme ?? "", value => onChange(current => updateAgentIcon(current, index, { theme: value })))}
                    <Button type="button" icon="delete" size="small" variant="transparent"
                        title={t("agentEdit.iconRemove")} aria-label={t("agentEdit.iconRemove")}
                        onClick={() => onChange(current => removeAgentIcon(current, index))}>{t("agentEdit.iconRemove")}</Button>
                </div>)}
                <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
                    <Input label={t("agentEdit.iconUrl")} type="url" value={src}
                        onChange={event => setSrc(event.target.value)}
                        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); add(); } }} />
                    {themeSelect(theme, setTheme)}
                    <Button type="button" icon="add" size="small" variant="informative"
                        disabled={!src.trim()} onClick={add}>{t("agentEdit.iconAdd")}</Button>
                </div>
            </div>
        </Card>
    </div>;
};
