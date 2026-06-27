import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type ModalStoryArgs = {
  title: string;
  size?: string;
  centered?: boolean;
  children: string;
  openButtonLabel: string;
  defaultOpen?: boolean;
};

const ModalStory = ({ openButtonLabel, defaultOpen = false, ...args }: ModalStoryArgs) => {
  const { Modal, Button } = useTheme() as unknown as Pick<AihUiTheme, "Modal" | "Button">;
  const [show, setShow] = useState(defaultOpen);

  useEffect(() => {
    setShow(defaultOpen);
  }, [defaultOpen]);

  return (
    <>
      <Button onClick={() => setShow(true)}>{openButtonLabel}</Button>
      <Modal
        {...args}
        show={show}
        onHide={() => setShow(false)}
        actions={<Button onClick={() => setShow(false)}>Close</Button>}
      >
        {args.children}
      </Modal>
    </>
  );
};

const meta = {
  title: "Modal",
  component: ModalStory,
  argTypes: {
    title: { control: { type: "text" } },
    size: { control: { type: "select" }, options: ["small", "medium", "large", "full"] },
    centered: { control: { type: "boolean" } },
    children: { control: { type: "text" } },
    openButtonLabel: { control: { type: "text" } },
    defaultOpen: { control: { type: "boolean" } },
  },
  args: {
    title: "Modal Title",
    size: "medium",
    centered: true,
    children: "Modal Content",
    openButtonLabel: "Open Modal",
    defaultOpen: false,
  },
} satisfies Meta<typeof ModalStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: {
    size: "large",
    title: "Large Modal",
  },
};

export const DarkModeOpen: Story = {
  args: {
    defaultOpen: true,
    title: "Dark mode modal text",
    children: "The title and body should inherit the Bootstrap body text color instead of hardcoded black.",
  },
};
