import React, { useEffect, useMemo, useState } from "react";
import { Resource } from "@modelcontextprotocol/sdk/types.js";
import type { Meta, StoryObj } from "@storybook/react";
import { ResourceSelectModal } from "aihappey-components";

const SAMPLE_RESOURCES: Resource[] = [
    {
        uri: "https://www.nu.nl",
        name: "nu.nl",
        title: "nu.nl",
        description: "Dutch news site (example resource)",
        mimeType: "text/html",
        annotations: {
            priority: 0.8,
        },
    },
    {
        uri: "https://example.com/docs/getting-started",
        name: "Getting Started",
        title: "Getting Started",
        description: "Example documentation resource",
        mimeType: "text/html",
        annotations: {
            priority: 0.4,
        },
    },
    {
        uri: "https://via.placeholder.com/640x360.png",
        name: "Example image",
        title: "Placeholder image",
        mimeType: "image/png",
        annotations: {
            priority: 0.2,
        },
    },
];

type ControlledProps = Omit<React.ComponentProps<typeof ResourceSelectModal>, "open" | "onHide"> & {
    initialOpen: boolean;
};
const Controlled: React.FC<ControlledProps> = ({ initialOpen, ...args }) => {
    const [open, setOpen] = useState(initialOpen);

    return (
        <ResourceSelectModal
            {...args}
            open={open}
            onHide={() => {
                setOpen(false);
                (args as Partial<React.ComponentProps<typeof ResourceSelectModal>>)
                    .onHide?.();
            }}
            onSelect={(uri) => {
                args.onSelect(uri);
                setOpen(false);
            }}
        />
    );
};


const meta = {
    title: "Modals/ResourceSelectModal",
    component: ResourceSelectModal,
    args: {
        resources: SAMPLE_RESOURCES,
        open: true,
        onSelect: (() => { }) as any,
        onHide: (() => { }) as any,
    },
    argTypes: {
        resources: { control: "object" },
        open: { control: false }, // controlled by wrapper
        onSelect: { action: "select", control: false },
        onHide: { action: "hide", control: false },
    },
} satisfies Meta<typeof ResourceSelectModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultOpen: Story = {
    args: {
        initialOpen: true,
    } as any,
    render: (args) => <Controlled {...(args as any)} />,
};

export const Empty: Story = {
    args: {
        initialOpen: true,
        resources: [],
    } as any,
    render: (args) => <Controlled {...(args as any)} />,
};

export const ManyResources: Story = {
    render: () => {
        const resources = useMemo<Resource[]>(() => {
            return Array.from({ length: 15 }, (_, i) => ({
                uri: `https://example.com/resource/${i + 1}`,
                name: `Resource ${i + 1}`,
                title: `Resource ${i + 1}`,
                description: "Example resource for scrolling/layout testing",
                mimeType: "text/plain",
                annotations: { priority: 0.5 },
            }));
        }, []);

        return (
            <Controlled
                initialOpen={true}
                resources={resources}
                onSelect={() => { }}
            // Provide a no-op so the wrapper can call it (it is required in the real component type)
            />
        );
    },
};

