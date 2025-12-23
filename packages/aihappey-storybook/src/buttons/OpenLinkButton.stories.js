import React from "react";
import { OpenLinkButton } from "aihappey-components";

export default {
  title: "Buttons/OpenLinkButton",
  component: OpenLinkButton,
};

export const Default = () =>
  React.createElement(OpenLinkButton, {
    url: "https://example.com",
    text: "Open Example",
  });

export const IconOnly = () =>
  React.createElement(OpenLinkButton, {
    url: "https://example.com",
    title: "Go to Example",
  });

export const Disabled = () =>
  React.createElement(OpenLinkButton, {
    url: "https://example.com",
    text: "Cannot Open",
    disabled: true,
  });

export const SmallSubtle = () =>
  React.createElement(OpenLinkButton, {
    url: "https://example.com",
    size: "small",
    variant: "subtle",
  });
