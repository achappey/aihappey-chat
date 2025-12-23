import React from "react";
import { CopyToClipboardButton } from "aihappey-components";

export default {
  title: "Buttons/CopyToClipboardButton",
  component: CopyToClipboardButton,
};

export const Default = () =>
  React.createElement(CopyToClipboardButton, {
    onClick: () => alert("Copied!"),
  });

export const Small = () =>
  React.createElement(CopyToClipboardButton, {
    size: "small",
    onClick: () => alert("Copied!"),
  });

export const Large = () =>
  React.createElement(CopyToClipboardButton, {
    size: "large",
    onClick: () => alert("Copied!"),
  });
