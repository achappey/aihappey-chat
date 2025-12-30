import React, { useEffect, useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ResourceTags } from "aihappey-components";
import type { ReadResourceResult, Resource } from "@modelcontextprotocol/sdk/types.js";

const makeResources = (): [Resource, ReadResourceResult][] => {
  const r1: Resource = {
    uri: "files:///docs/hello.txt",
    name: "hello.txt",
    description: "A plain text file",
    mimeType: "text/plain",
  };

  const r2: Resource = {
    uri: "files:///data/payload.json",
    name: "payload.json",
    description: "Some JSON payload",
    mimeType: "application/json",
  };

  const r3: Resource = {
    uri: "sharepoint:///sites/fakton/Shared%20Documents/spec.pdf",
    name: "spec.pdf",
    description: "A PDF from SharePoint",
    mimeType: "application/pdf",
  };

  const rr1: ReadResourceResult = {
    contents: [
      {
        uri: r1.uri,
        mimeType: r1.mimeType,
        text: "Hello world",
      },
    ],
  };

  const rr2: ReadResourceResult = {
    contents: [
      {
        uri: r2.uri,
        mimeType: r2.mimeType,
        text: JSON.stringify({ ok: true }, null, 2),
      },
    ],
  };

  const rr3: ReadResourceResult = {
    contents: [
      {
        uri: r3.uri,
        mimeType: r3.mimeType,
        // blob is base64; keep it tiny for story
        blob: "JVBERi0xLjQKJcTl8uXrp/Og0MTGCg==",
      },
    ],
  };

  return [
    [r1, rr1],
    [r2, rr2],
    [r3, rr3],
  ];
};

const RESOURCES_SINGLE = [makeResources()[0]];
const RESOURCES_MANY = makeResources();

const meta = {
  title: "Fields/ResourceTags",
  component: ResourceTags,
  args: {
    size: "small",
  },
  argTypes: {
    size: { control: "select", options: ["extra-small", "small", "medium"] },
    resources: { control: false }, // tuples + complex types => no controls
    removeResource: { control: false },
  },
} satisfies Meta<typeof ResourceTags>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof ResourceTags>> = (args) => {
  // keep stable snapshot of initial resources (per story)
  const initialResources = useMemo(() => args.resources, [args.resources]);
  const [resources, setResources] = useState<[Resource, ReadResourceResult][]>(initialResources);

  // reset when switching stories
  useEffect(() => {
    setResources(initialResources);
  }, [initialResources]);

  const controlledRemove =
    args.removeResource != null
      ? async (id: string) => {
          await args.removeResource?.(id);
          setResources((prev) => prev.filter(([r]) => r.uri !== id));
        }
      : undefined;

  return (
    <div style={{ maxWidth: 520 }}>
      <ResourceTags {...args} resources={resources} removeResource={controlledRemove} />
    </div>
  );
};

export const Single: Story = {
  args: {
    resources: RESOURCES_SINGLE,
  },
  render: (args) => <Controlled {...args} />,
};

export const Many: Story = {
  args: {
    resources: RESOURCES_MANY,
  },
  render: (args) => <Controlled {...args} />,
};

export const Medium: Story = {
  args: {
    size: "medium",
    resources: RESOURCES_MANY,
  },
  render: (args) => <Controlled {...args} />,
};

export const Removable: Story = {
  args: {
    resources: RESOURCES_MANY,
    // no-op is enough; Controlled does the real state update
    removeResource: async () => {},
  },
  render: (args) => <Controlled {...args} />,
};
