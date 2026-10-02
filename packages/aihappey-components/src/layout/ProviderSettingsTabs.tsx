import React, { useState } from "react";
import type { IconToken } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";

export type ProviderSettingsTab = {
    id: string;
    title: string;
    icon?: IconToken;
    content: React.ReactNode;
};

/** A single navigation rail shared by model details and chat configuration. */
export const ProviderSettingsTabs: React.FC<{
    tabs: ProviderSettingsTab[];
}> = ({ tabs }) => {
    const { Tabs, Tab } = useTheme();
    const [selected, setSelected] = useState(tabs[0]?.id ?? "");
    // Resolve removed tabs synchronously, without briefly rendering an empty panel.
    const active = tabs.some((tab) => tab.id === selected) ? selected : tabs[0]?.id ?? "";
    const iconOnly = tabs.every((tab) => !!tab.icon)
        && new Set(tabs.map((tab) => tab.icon)).size === tabs.length;

    if (!tabs.length) return null;
    return <Tabs vertical iconOnly={iconOnly} activeKey={active} onSelect={setSelected}
        style={{ width: "100%", minWidth: 0, marginTop: 12 }}>
        {tabs.map((tab) => <Tab key={tab.id} eventKey={tab.id} icon={tab.icon} title={tab.title}>
            {active === tab.id ? <div style={{ minWidth: 0 }}>{tab.content}</div> : null}
        </Tab>)}
    </Tabs>;
};
