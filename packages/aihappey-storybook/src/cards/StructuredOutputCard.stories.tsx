import type { Meta, StoryObj } from "@storybook/react";
import { I18nProvider } from "aihappey-i18n";
import { StructuredOutputCard } from "aihappey-components";

const exampleItem = {
  id: "schema-1",
  name: "User Profile",
  json_schema: JSON.stringify(
    {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        address: {
          type: "object",
          properties: {
            city: { type: "string" },
            zip: { type: "string" },
          },
        },
      },
      required: ["name"],
    },
    null,
    2
  ),
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
    item: exampleItem,
    onEdit: () => undefined,
  },
};

export const LongSchema: Story = {
  args: {
    item: {
      ...exampleItem,
      id: "schema-2",
      name: "Complex payload",
      json_schema: JSON.stringify(
        {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                roles: { type: "array", items: { type: "string" } },
              },
            },
            metrics: {
              type: "object",
              properties: {
                latencyMs: { type: "number" },
                tokens: {
                  type: "object",
                  properties: {
                    input: { type: "number" },
                    output: { type: "number" },
                  },
                },
              },
            },
          },
        },
        null,
        2
      ),
    },
  },
};

