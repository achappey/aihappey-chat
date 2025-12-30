import type { Meta, StoryObj } from "@storybook/react";
import { I18nProvider } from "aihappey-i18n";
import type { ToolCallResult } from "aihappey-types";
import { StructuredOutputCard } from "aihappey-components";

const exampleResult: ToolCallResult = {
  content: [],
  structuredContent: {
    name: "John Doe",
    age: 30,
    address: {
      city: "New York",
      zip: "10001",
    },
  },
};

const meta = {
  title: "Cards/StructuredOutputCard",
  component: StructuredOutputCard,
  decorators: [
    (Story) => {
      // StructuredOutputCard calls `useTranslation()`; ensure i18n is initialized.
      return <I18nProvider>{Story()}</I18nProvider>;
    },
  ],
} satisfies Meta<typeof StructuredOutputCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    result: exampleResult,
  },
};

export const WithTitle: Story = {
  args: {
    result: exampleResult,
    title: "User Profile",
  },
};

export const NestedStructuredContent: Story = {
  args: {
    title: "Complex payload",
    result: {
      content: [],
      structuredContent: {
        ok: true,
        user: {
          id: "u_123",
          roles: ["admin", "editor"],
        },
        metrics: {
          latencyMs: 123,
          tokens: { input: 42, output: 128 },
        },
      },
    },
  },
};

