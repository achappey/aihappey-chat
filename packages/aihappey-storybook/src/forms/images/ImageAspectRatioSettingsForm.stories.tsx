import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ImageAspectRatioSettingsForm,
  type ImageAspectRatioSettings,
} from "aihappey-components";

const meta = {
  title: "Forms/Images/ImageAspectRatioSettingsForm",
  component: ImageAspectRatioSettingsForm,
  args: {
    value: { aspectRatio: undefined },
    onChange: (() => { }) as any,
  },
  argTypes: {
    value: { control: false },
    onChange: { action: "change", control: false },
    aspectPresets: { control: "object" },
  },
} satisfies Meta<typeof ImageAspectRatioSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<
  Omit<React.ComponentProps<typeof ImageAspectRatioSettingsForm>, "value" | "onChange"> & {
    value: ImageAspectRatioSettings;
  }
> = (args) => {
  const [value, setValue] = useState<ImageAspectRatioSettings>(args.value);

  // reset when switching stories
  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return (
    <ImageAspectRatioSettingsForm
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        (args as Partial<React.ComponentProps<typeof ImageAspectRatioSettingsForm>>).onChange?.(next);
      }}
    />
  );
};

export const ProviderDefault: Story = {
  args: {
    value: { aspectRatio: undefined },
  },
  render: (args) => <Controlled {...args} />,
};

export const Preset: Story = {
  args: {
    value: { aspectRatio: "16:9" },
  },
  render: (args) => <Controlled {...args} />,
};

export const Custom: Story = {
  args: {
    value: { aspectRatio: "5:4" },
  },
  render: (args) => <Controlled {...args} />,
};

export const WithCustomPresets: Story = {
  args: {
    value: { aspectRatio: "3:2" },
    aspectPresets: [
      { w: 1, h: 1, label: "Square" },
      { w: 3, h: 2, label: "Photo 3:2" },
      { w: 16, h: 9, label: "Widescreen" },
      { w: 9, h: 16, label: "Portrait" },
    ],
  },
  render: (args) => <Controlled {...args} />,
};

