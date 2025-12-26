import React from "react";
import { ImageGrid } from "aihappey-components";

export default {
  title: "Images/ImageGrid",
  component: ImageGrid,
};

// Small 1x1 transparent PNG as base64
const tinyPng =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const items = [
  { type: "image", mimeType: "image/png", data: tinyPng },
  { type: "image", mimeType: "image/png", data: tinyPng },
  { type: "image", mimeType: "image/png", data: tinyPng },
  { type: "image", mimeType: "image/png", data: tinyPng },
  { type: "image", mimeType: "image/png", data: tinyPng },
  { type: "image", mimeType: "image/png", data: tinyPng },
];

export const Default = () =>
  React.createElement(ImageGrid, {
    items,
  });

export const ThreeColumns = () =>
  React.createElement(ImageGrid, {
    items,
    columns: 3,
  });

export const ContainRoundedShadow = () =>
  React.createElement(ImageGrid, {
    items,
    fit: "contain",
    shape: "rounded",
    shadow: true,
    gap: 12,
  });

