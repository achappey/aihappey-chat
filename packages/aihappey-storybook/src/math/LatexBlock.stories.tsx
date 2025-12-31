import type { Meta, StoryObj } from "@storybook/react";
import "katex/dist/katex.min.css";
import { LatexBlock } from "aihappey-components";

const meta: Meta<typeof LatexBlock> = {
  title: "Math/LatexBlock",
  component: LatexBlock,
};

export default meta;
type Story = StoryObj<typeof LatexBlock>;

export const Block: Story = {
  render: () => (
    <LatexBlock
      block
      latex={String.raw`\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}`}
    />
  ),
};

export const Inline: Story = {
  render: () => (
    <div>
      Inline math:{" "}
      <LatexBlock
        block={false}
        latex={String.raw`E = mc^2`}
      />{" "}
      in a sentence.
    </div>
  ),
};

export const InvalidLatex: Story = {
  render: () => (
    <LatexBlock
      block
      latex={String.raw`\frac{1}{`}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <LatexBlock
      block
      latex={"   "}
    />
  ),
};
