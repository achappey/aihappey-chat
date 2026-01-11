import React, { useEffect, useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { DrawerComponent, DrawerPosition, DrawerSize } from "aihappey-types";

type DrawerStoryArgs = {
  title: string;
  overlay: boolean;
  position: DrawerPosition;
  size: DrawerSize;
  backdrop: boolean;
  headerNavigationEnabled: boolean;
  children: string;
  openButtonLabel: string;
  defaultOpen: boolean;
};

const DrawerStory = (args: DrawerStoryArgs) => {
  const {
    title,
    overlay,
    position,
    size,
    backdrop,
    headerNavigationEnabled,
    children,
    openButtonLabel,
    defaultOpen,
  } = args;

  const { Drawer, Button } = useTheme() as {
    Drawer: DrawerComponent;
    Button: React.ComponentType<{
      onClick?: () => void;
      children?: React.ReactNode;
    }>;
  };

  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  const headerNavigation = useMemo(() => {
    if (!headerNavigationEnabled) return undefined;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginRight: 8,
        }}
      >
        <span style={{ fontSize: 12, opacity: 0.8 }}>Header navigation</span>
      </div>
    );
  }, [headerNavigationEnabled]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>{openButtonLabel}</Button>
      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        overlay={overlay}
        position={position}
        size={size}
        backdrop={backdrop}
        headerNavigation={headerNavigation}
      >
        {children}
      </Drawer>
    </>
  );
};

const meta = {
  title: "Drawer",
  component: DrawerStory,
  argTypes: {
    title: {
      control: { type: "text" },
    },
    overlay: {
      control: { type: "boolean" },
    },
    position: {
      control: { type: "select" },
      options: ["start", "end", "top", "bottom"] satisfies DrawerPosition[],
    },
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large", "full"] satisfies DrawerSize[],
    },
    backdrop: {
      control: { type: "boolean" },
    },
    headerNavigationEnabled: {
      control: { type: "boolean" },
      name: "headerNavigation (enabled)",
    },
    children: {
      control: { type: "text" },
    },
    openButtonLabel: {
      control: { type: "text" },
    },
    defaultOpen: {
      control: { type: "boolean" },
    },
  },
  args: {
    title: "Drawer Title",
    overlay: false,
    position: "end",
    size: "medium",
    backdrop: true,
    headerNavigationEnabled: false,
    children: "Drawer Content",
    openButtonLabel: "Open Drawer",
    defaultOpen: false,
  },
} satisfies Meta<typeof DrawerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

