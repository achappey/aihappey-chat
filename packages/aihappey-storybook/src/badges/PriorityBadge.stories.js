import React from "react";
import { PriorityBadge } from "aihappey-components";

export default {
  title: "Badges/PriorityBadge",
  component: PriorityBadge,
};

export const Low = () =>
  React.createElement(PriorityBadge, {
    priority: 1,
  });

export const Medium = () =>
  React.createElement(PriorityBadge, {
    priority: 5,
  });

export const High = () =>
  React.createElement(PriorityBadge, {
    priority: 10,
  });
