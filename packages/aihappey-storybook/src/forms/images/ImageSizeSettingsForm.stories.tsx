import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ImageSizeSettingsForm, type ImageSizeSettings } from "aihappey-components";

const meta = {
    title: "Forms/Images/ImageSizeSettingsForm",
    component: ImageSizeSettingsForm,
    args: {
        value: { size: undefined },
        onChange: (() => { }) as any,
    },
    argTypes: {
        value: { control: false },
        onChange: { action: "change", control: false },
        sizePresets: { control: "object" },
    },
} satisfies Meta<typeof ImageSizeSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<
    Omit<React.ComponentProps<typeof ImageSizeSettingsForm>, "value" | "onChange"> & {
        value: ImageSizeSettings;
    }
> = (args) => {
    const [value, setValue] = useState<ImageSizeSettings>(args.value);

    // reset when switching stories
    useEffect(() => {
        setValue(args.value);
    }, [args.value]);

    return (
        <div style={{ maxWidth: 520 }}>
            <ImageSizeSettingsForm
                {...args}
                value={value}
                onChange={(next) => {
                    setValue(next);
                    (args as Partial<React.ComponentProps<typeof ImageSizeSettingsForm>>).onChange?.(next);
                }}
            />
        </div>
    );
};

export const ProviderDefault: Story = {
    args: {
        value: { size: undefined },
    },
    render: (args) => <Controlled {...args} />,
};

export const Preset: Story = {
    args: {
        value: { size: "512x512" },
    },
    render: (args) => <Controlled {...args} />,
};

export const Custom: Story = {
    args: {
        value: { size: "640x360" },
    },
    render: (args) => <Controlled {...args} />,
};

export const WithCustomPresets: Story = {
    args: {
        value: { size: "640x360" },
        sizePresets: [
            { w: 256, h: 256, label: "Square S" },
            { w: 512, h: 512, label: "Square M" },
            { w: 640, h: 360, label: "HD 16:9" },
            { w: 1024, h: 1024, label: "Square L" },
        ],
    },
    render: (args) => <Controlled {...args} />,
};

