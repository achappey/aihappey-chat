import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ImageSettingsForm, type ImageSettings } from "aihappey-components";

const meta = {
  title: "Forms/Images/ImageSettingsForm",
  component: ImageSettingsForm,
  args: {
    value: {
      size: undefined,
      aspectRatio: undefined,
      n: 1,
      seed: undefined,
      maxImagesPerCall: undefined,
    },
    onChange: (() => {}) as any,
  },
  argTypes: {
    value: { control: false },
    onChange: { action: "change", control: false },
    sizePresets: { control: "object" },
    aspectPresets: { control: "object" },
  },
} satisfies Meta<typeof ImageSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof ImageSettingsForm>> = (args) => {
  const [value, setValue] = useState<ImageSettings>(args.value);

  // reset when switching stories
  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return (
    <div style={{ maxWidth: 720 }}>
      <ImageSettingsForm
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange?.(next);
        }}
      />
    </div>
  );
};

export const Playground: Story = {
  args: {
    value: {
      size: undefined,
      aspectRatio: undefined,
      n: 1,
      seed: undefined,
      maxImagesPerCall: undefined,
    },
  },
  render: (args) => <Controlled {...args} />,
};

export const WithSeedAndLimits: Story = {
  args: {
    value: {
      size: "1024x1024",
      aspectRatio: "1:1",
      n: 4,
      seed: 42,
      maxImagesPerCall: 2,
    },
  },
  render: (args) => <Controlled {...args} />,
};

export const ManyOutputs: Story = {
  args: {
    value: {
      size: "768x768",
      aspectRatio: undefined,
      n: 20,
      seed: undefined,
      maxImagesPerCall: 5,
    },
  },
  render: (args) => <Controlled {...args} />,
};

export const WithCustomPresets: Story = {
  args: {
    value: {
      size: "640x360",
      aspectRatio: "16:9",
      n: 3,
      seed: 7,
      maxImagesPerCall: 3,
    },
    sizePresets: [
      { w: 256, h: 256, label: "Square S" },
      { w: 512, h: 512, label: "Square M" },
      { w: 640, h: 360, label: "HD 16:9" },
      { w: 1024, h: 576, label: "Wide 16:9" },
    ],
    aspectPresets: [
      { w: 1, h: 1, label: "Square" },
      { w: 4, h: 3, label: "4:3" },
      { w: 16, h: 9, label: "Widescreen" },
      { w: 9, h: 16, label: "Portrait" },
    ],
  },
  render: (args) => <Controlled {...args} />,
};

