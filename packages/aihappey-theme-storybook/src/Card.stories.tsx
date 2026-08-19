import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type CardStoryArgs = {
  size?: "small" | "medium" | "large";
  title?: string;
  description?: string;
  text?: string;
  useChildren?: boolean;
  showImage?: boolean;
  imageSrc?: string;
  imageAlt?: string;
  showActions?: boolean;
  showHeaderActions?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const CardStory = (args: CardStoryArgs) => {
  const { Card, Button, Image } =
    useTheme() as unknown as Pick<AihUiTheme, "Card" | "Button" | "Image">;

  const image = args.showImage ? (
    <Image
      src={args.imageSrc ?? "https://placehold.co/600x400/png?text=Card+image"}
      alt={args.imageAlt ?? "Card preview"}
      fit="contain"
      width={64}
      height={64}
    />
  ) : undefined;

  const actions = args.showActions ? (
    <div style={{ display: "flex", gap: 8 }}>
      <Button onClick={() => console.log("Card: primary action")}>Action</Button>
      <Button
        variant="secondary"
        onClick={() => console.log("Card: secondary action")}
      >
        Secondary
      </Button>
    </div>
  ) : undefined;

  const headerActions = args.showHeaderActions ? (
    <div style={{ display: "flex", gap: 8 }}>
      <Button variant="outline" onClick={() => console.log("Card: edit")}>Edit</Button>
      <Button
        variant="transparent"
        onClick={() => console.log("Card: close")}
      >
        Close
      </Button>
    </div>
  ) : undefined;

  const content = args.useChildren ? (
    <div style={{ display: "grid", gap: 8 }}>
      <div>
        This story renders the card body via <code>children</code> (instead of
        the <code>text</code> prop).
      </div>
      <div style={{ opacity: 0.8 }}>
        You can put richer content here (lists, links, etc.).
      </div>
    </div>
  ) : undefined;

  return (
    <Card
      title={args.title ?? "Card title"}
      size={args.size}
      description={args.description ?? "Card description"}
      text={args.useChildren ? undefined : args.text ?? "Card body text"}
      image={image}
      actions={actions}
      headerActions={headerActions}
      className={args.className}
      style={{ width: 360, ...(args.style ?? {}) }}
    >
      {content}
    </Card>
  );
};

const meta = {
  title: "Card",
  component: CardStory,
} satisfies Meta<typeof CardStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: "medium",
    title: "Default Card",
    description: "Standard card description.",
    text: "This is a default medium card.",
    showImage: true,
    showActions: true,
  },
};

export const Small: Story = {
  args: {
    size: "small",
    title: "Small Card",
    description: "Small size description.",
    text: "Compact content.",
    showImage: false,
    showActions: false,
    style: { width: 240 },
  },
};

export const Large: Story = {
  args: {
    size: "large",
    title: "Large Card",
    description: "Detailed description for the large card variant.",
    text:
      "This is a larger card intended for more prominent content presentation.",
    showImage: true,
    showActions: true,
    style: { width: 420 },
  },
};

export const WithHeaderActions: Story = {
  args: {
    size: "medium",
    title: "Card with Header Actions",
    description: "",
    text: "Notice the actions in the top right corner.",
    showHeaderActions: true,
    showImage: false,
    showActions: false,
    style: { width: 380 },
  },
};

export const WithChildren: Story = {
  args: {
    size: "medium",
    title: "Card using children",
    description: "A card can render its body from children.",
    useChildren: true,
    showImage: true,
    showActions: true,
    style: { width: 420 },
  },
};

export const WithWideTransparentImage: Story = {
  args: {
    size: "medium",
    title: "Wide logo",
    description: "Wide artwork is contained inside the card thumbnail.",
    text: "The image keeps its proportions without taking over the card.",
    showImage: true,
    imageSrc: "https://placehold.co/640x160/transparent/2563eb/png?text=WIDE+LOGO",
    imageAlt: "Wide sample logo",
    showActions: true,
  },
};

export const WithTallImage: Story = {
  args: {
    size: "small",
    title: "Tall artwork",
    description: "Tall artwork remains bounded and centered.",
    text: "Compact cards preserve their layout with unusual image ratios.",
    showImage: true,
    imageSrc: "https://placehold.co/160x640/7c3aed/ffffff/png?text=TALL",
    imageAlt: "Tall sample artwork",
    showHeaderActions: true,
    style: { width: 320 },
  },
};

