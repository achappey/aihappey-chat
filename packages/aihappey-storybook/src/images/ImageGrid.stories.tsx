import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ImageContent } from "@modelcontextprotocol/sdk/types.js";
import { ImageGrid } from "aihappey-components";

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

// Small 1x1 transparent PNG as base64 (raw base64 path; ImageGrid will normalize)
const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const demoItems: ImageContent[] = [
  {
    type: "image",
    mimeType: "image/png",
    data: tinyPngBase64,
  },
  {
    type: "image",
    mimeType: "image/svg+xml",
    data: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#3b82f6"/>
            <stop offset="1" stop-color="#22c55e"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="64" fill="url(#g)"/>
        <text x="50%" y="54%" text-anchor="middle" font-size="56" fill="white" font-family="Arial, sans-serif">SVG</text>
      </svg>`
    ),
  },
  {
    type: "image",
    mimeType: "image/svg+xml",
    data: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <rect width="512" height="512" fill="#111827"/>
        <circle cx="256" cy="256" r="168" fill="#f97316"/>
        <text x="50%" y="54%" text-anchor="middle" font-size="56" fill="white" font-family="Arial, sans-serif">Cover</text>
      </svg>`
    ),
  },
  {
    type: "image",
    mimeType: "image/svg+xml",
    data: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <rect width="512" height="512" fill="#0f172a"/>
        <rect x="96" y="160" width="320" height="192" rx="24" fill="#a855f7"/>
        <text x="50%" y="54%" text-anchor="middle" font-size="56" fill="white" font-family="Arial, sans-serif">Grid</text>
      </svg>`
    ),
  },
  {
    type: "image",
    mimeType: "image/svg+xml",
    data: svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <rect width="512" height="512" fill="#f1f5f9"/>
        <path d="M96 384 L224 224 L320 320 L416 160 L416 416 L96 416 Z" fill="#10b981"/>
        <text x="50%" y="44%" text-anchor="middle" font-size="52" fill="#111827" font-family="Arial, sans-serif">Contain</text>
      </svg>`
    ),
  },
  {
    type: "image",
    mimeType: "image/png",
    data: tinyPngBase64,
  },
];

const meta = {
  title: "Images/ImageGrid",
  component: ImageGrid,
  parameters: {
    docs: {
      description: {
        component:
          "Grid of images rendered via the active UI theme (Image, Button, Skeleton). Includes optional shimmer placeholders and click/download hooks.",
      },
    },
  },
  argTypes: {
    items: { control: false },
    columns: { control: { type: "number", min: 1, step: 1 } },
    gap: {
      control: { type: "text" },
      description: "Accepts a number (px-ish) or any CSS length string (e.g. '12px', '1rem').",
    },
    fit: { control: { type: "inline-radio" }, options: ["cover", "contain"] },
    shape: {
      control: { type: "inline-radio" },
      options: ["square", "rounded", "circular"],
    },
    shadow: { control: { type: "boolean" } },
    shimmers: { control: { type: "number", min: 0, step: 1 } },
    style: { control: false },
    onImageClick: { action: "onImageClick" },
    onImageDownload: { action: "onImageDownload" },
  },
} satisfies Meta<typeof ImageGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    items: demoItems,
    columns: undefined,
    gap: "1rem",
    fit: "cover",
    shape: "square",
    shadow: false,
    shimmers: 0,
    style: {
      padding: "0.5rem",
    },
  },
};

export const AutoColumns: Story = {
  args: {
    items: demoItems,
    gap: "1rem",
  },
};

export const ThreeColumns: Story = {
  args: {
    items: demoItems,
    columns: 3,
  },
};

export const GapNumber: Story = {
  args: {
    items: demoItems,
    columns: 3,
    gap: 12,
  },
};

export const GapString: Story = {
  args: {
    items: demoItems,
    columns: 3,
    gap: "24px",
  },
};

export const ContainRoundedShadow: Story = {
  args: {
    items: demoItems,
    fit: "contain",
    shape: "rounded",
    shadow: true,
    gap: 12,
  },
};

export const CircularCoverShadow: Story = {
  args: {
    items: demoItems,
    columns: 4,
    fit: "cover",
    shape: "circular",
    shadow: true,
    gap: "0.75rem",
  },
};

export const WithShimmers: Story = {
  args: {
    items: demoItems,
    columns: 3,
    shimmers: 6,
    gap: "1rem",
  },
};

const downloadViaBlob = async (item: ImageContent, index: number) => {
  // Storybook-side download helper, mirroring the robust approach in
  // [`handleDownload()`](packages/aihappey-components/src/images/ImageGrid.tsx:51)
  const href = item.data.startsWith("data:")
    ? item.data
    : `data:${item.mimeType};base64,${item.data}`;

  const res = await fetch(href);
  const blob = await res.blob();

  const ext =
    (
      {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg",
        "image/bmp": "bmp",
        "image/avif": "avif",
      } as Record<string, string>
    )[item.mimeType] || "bin";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `storybook_image_${index}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const Interactions: Story = {
  args: {
    items: demoItems,
    columns: 3,
    gap: "1rem",
    shape: "rounded",
    shadow: true,
    onImageClick: (item, index) => {
      console.log("Image clicked", {
        index,
        mimeType: item.mimeType,
        dataLength: item.data.length,
        isDataUrl: item.data.startsWith("data:"),
      });
    },
    onImageDownload: async (item) => {
      console.log("Download requested", {
        mimeType: item.mimeType,
        dataLength: item.data.length,
      });

      const index = Math.max(
        0,
        demoItems.findIndex(
          (x) => x.mimeType === item.mimeType && x.data === item.data
        )
      );

      await downloadViaBlob(item, index);
    },
  },
  render: (args) => <ImageGrid {...args} />,
};

