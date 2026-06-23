import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AccordionVariant, AihUiTheme } from "aihappey-types";

type AccordionStoryArgs = {
  multiple?: boolean;
  collapsible?: boolean;
  variant?: AccordionVariant;
  defaultOpenItems?: string[];
};

const AccordionStory = (args: AccordionStoryArgs) => {
  const { Accordion } = useTheme() as unknown as Pick<AihUiTheme, "Accordion">;

  return (
    <Accordion
      {...args}
      items={[
        {
          key: "overview",
          header: "Overview",
          content: "A short overview panel that should render consistently in every theme.",
        },
        {
          key: "details",
          header: "Details",
          content: (
            <div style={{ display: "grid", gap: 8 }}>
              <span>Richer accordion content can include multiple elements.</span>
              <strong>Keyboard and mouse toggling should both work.</strong>
            </div>
          ),
        },
        {
          key: "disabled",
          header: "Disabled item",
          content: "This content should not be reachable while disabled.",
          disabled: true,
        },
      ]}
    />
  );
};

const meta = {
  title: "Accordion",
  component: AccordionStory,
  argTypes: {
    multiple: { control: { type: "boolean" } },
    collapsible: { control: { type: "boolean" } },
    variant: { control: { type: "select" }, options: ["default", "flush"] },
    defaultOpenItems: { control: "object" },
  },
  args: {
    multiple: false,
    collapsible: true,
    variant: "default",
    defaultOpenItems: ["overview"],
  },
} satisfies Meta<typeof AccordionStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MultipleOpen: Story = {
  args: {
    multiple: true,
    defaultOpenItems: ["overview", "details"],
  },
};

export const Flush: Story = {
  args: {
    variant: "flush",
  },
};

