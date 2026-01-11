import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme, IconToken } from "aihappey-types";

type BreadcrumbStoryArgs = {
  size?: "small" | "medium" | "large";
  separator?: React.ReactNode;
  withIcons?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const BreadcrumbStory = (args: BreadcrumbStoryArgs) => {
  const { Breadcrumb } = useTheme() as unknown as Pick<AihUiTheme, "Breadcrumb">;

  const items: Parameters<AihUiTheme["Breadcrumb"]>[0]["items"] = [
    {
      key: "home",
      label: "Home",
      icon: args.withIcons ? ("folder" satisfies IconToken) : undefined,
      onClick: () => console.log("Breadcrumb: Home"),
    },
    {
      key: "section",
      label: "Section",
      icon: args.withIcons ? ("catalog" satisfies IconToken) : undefined,
      onClick: () => console.log("Breadcrumb: Section"),
    },
    {
      key: "page",
      label: "Page",
      icon: args.withIcons ? ("bookOpen" satisfies IconToken) : undefined,
    },
  ];

  return (
    <Breadcrumb
      items={items}
      size={args.size}
      separator={args.separator}
      className={args.className}
      style={args.style}
    />
  );
};

const meta = {
  title: "Breadcrumb",
  component: BreadcrumbStory,
} satisfies Meta<typeof BreadcrumbStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: "medium",
  },
};

export const Small: Story = {
  args: {
    size: "small",
  },
};

export const Large: Story = {
  args: {
    size: "large",
  },
};

export const WithCustomSeparator: Story = {
  args: {
    size: "medium",
    separator: ">",
  },
};

export const WithIcons: Story = {
  args: {
    size: "medium",
    withIcons: true,
  },
};

