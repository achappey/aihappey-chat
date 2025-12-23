import React from "react";
import { ViewOutputButton } from "aihappey-components";

export default {
  title: "Buttons/ViewOutputButton",
  component: ViewOutputButton,
};

export const Default = () =>
  React.createElement(ViewOutputButton, {
    onClick: () => alert("View Output!"),
  });

export const Disabled = () =>
  React.createElement(ViewOutputButton, {
    disabled: true,
    onClick: () => alert("View Output!"),
  });
