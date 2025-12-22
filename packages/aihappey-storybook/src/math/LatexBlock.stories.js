import React from "react";
import "katex/dist/katex.min.css";
import { LatexBlock } from "aihappey-components";

export default {
  title: "Math/LatexBlock",
  component: LatexBlock,
};

export const Block = () =>
  React.createElement(LatexBlock, {
    block: true,
    latex: String.raw`\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}`,
  });

export const Inline = () =>
  React.createElement("div", null, [
    "Inline math: ",
    React.createElement(LatexBlock, {
      key: "inline",
      block: false,
      latex: String.raw`E = mc^2`,
    }),
    " in a sentence.",
  ]);

export const InvalidLatex = () =>
  React.createElement(LatexBlock, {
    block: true,
    latex: String.raw`\frac{1}{`,
  });

export const Empty = () =>
  React.createElement(LatexBlock, {
    block: true,
    latex: "   ",
  });