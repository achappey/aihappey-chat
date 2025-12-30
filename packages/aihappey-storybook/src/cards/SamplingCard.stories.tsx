import type { Meta, StoryObj } from "@storybook/react";
import type {
    CreateMessageRequest,
    CreateMessageResult,
} from "@modelcontextprotocol/sdk/types.js";
import { SamplingCard } from "aihappey-components";

const minimalRequest: CreateMessageRequest = {
    method: "sampling/createMessage",
    params: {
        messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
        maxTokens: 32,
        modelPreferences: {},
    },
};

const requestWithHint: CreateMessageRequest = {
    ...minimalRequest,
    params: {
        ...minimalRequest.params,
        modelPreferences: {
            hints: [{ name: "Prefer fast models" }],
        },
    },
};

const exampleResult: CreateMessageResult = {
    role: "assistant",
    content: { type: "text", text: "Hi!" },
    model: "gpt-4o-mini",
};

const meta = {
    title: "Cards/SamplingCard",
    component: SamplingCard,
} satisfies Meta<typeof SamplingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MinimalRequest: Story = {
    args: {
        request: minimalRequest,
    },
};

export const WithHintDescription: Story = {
    args: {
        request: requestWithHint,
    },
};

export const WithResultProvided: Story = {
    args: {
        request: requestWithHint,
        result: exampleResult,
    },
};

