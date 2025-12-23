import React from "react";
import { TemperatureBadge } from "aihappey-components";

export default {
  title: "Badges/TemperatureBadge",
  component: TemperatureBadge,
};

export const Zero = () =>
  React.createElement(TemperatureBadge, {
    temperature: 0,
  });

export const Half = () =>
  React.createElement(TemperatureBadge, {
    temperature: 0.5,
  });

export const One = () =>
  React.createElement(TemperatureBadge, {
    temperature: 1,
  });
