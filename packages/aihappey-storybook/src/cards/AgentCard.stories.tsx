import type { Meta, StoryObj } from "@storybook/react";
import type { Agent } from "aihappey-types";
import { AgentCard } from "aihappey-components";

const exampleAgent: Agent = {
    name: "Research assistant",
    instructions: "",
    description:
        "An example agent card showing how agent metadata and actions are rendered.",
    model: {
        id: "gpt-4o-mini",
    },
};

const meta = {
    title: "Cards/AgentCard",
    component: AgentCard,
} satisfies Meta<typeof AgentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Minimal: Story = {
    args: {
        agent: exampleAgent,
    },
};

export const WithEdit: Story = {
    args: {
        agent: exampleAgent,
        onEdit: () => { },
    },
};

export const WithDeleteMenu: Story = {
    args: {
        agent: exampleAgent,
        onDelete: () => { },
        translations: { delete: "Delete" },
    },
};

export const WithEditAndDelete: Story = {
    args: {
        agent: exampleAgent,
        onEdit: () => { },
        onDelete: () => { },
        translations: { delete: "Delete" },
    },
};

