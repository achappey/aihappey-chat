import React from "react";
import { CapabilityIcon } from "aihappey-components";

export default {
  title: "Images/CapabilityIcon",
  component: CapabilityIcon,
};

export const SingleIcon = () =>
  React.createElement(CapabilityIcon, {
    icons: [{ src: "https://via.placeholder.com/64", theme: "light" }],
  });

export const LightDarkList = () =>
  React.createElement(CapabilityIcon, {
    icons: [
      { src: "https://via.placeholder.com/64?text=Light", theme: "light" },
      { src: "https://via.placeholder.com/64?text=Dark", theme: "dark" },
    ],
  });

