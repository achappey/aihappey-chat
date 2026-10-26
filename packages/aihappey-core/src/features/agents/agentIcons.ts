import type { Agent } from "aihappey-types";

type AgentIcon = NonNullable<Agent["icons"]>[number];

/** Patch only the edited fields; MIME types, sizes and future metadata survive. */
export const updateAgentIcon = (agent: Agent, index: number, patch: Partial<Omit<AgentIcon, "theme">> & { theme?: string }): Agent => ({
    ...agent,
    icons: agent.icons?.map((icon, position) => {
        if (position !== index) return icon;
        const { theme, ...fields } = patch;
        const next = { ...icon, ...fields };
        if (theme === "") delete next.theme;
        else if (theme === "light" || theme === "dark") next.theme = theme;
        return next;
    }),
});

export const addAgentIcon = (agent: Agent, src: string, theme: string): Agent => {
    if (!src.trim()) return agent;
    const icon: AgentIcon = { src: src.trim() };
    if (theme === "light" || theme === "dark") icon.theme = theme;
    return { ...agent, icons: [...(agent.icons ?? []), icon] };
};

export const removeAgentIcon = (agent: Agent, index: number): Agent => {
    const icons = agent.icons?.filter((_, position) => position !== index);
    return { ...agent, icons: icons?.length ? icons : undefined };
};

/** Empty URL rows must not suppress the provider fallback after saving. */
export const prepareAgentIconsForSave = (agent: Agent): Agent => {
    if (!agent.icons) return agent;
    const icons = agent.icons.filter(icon => icon.src?.trim()).map(icon => ({ ...icon, src: icon.src.trim() }));
    return { ...agent, icons: icons.length ? icons : undefined };
};
