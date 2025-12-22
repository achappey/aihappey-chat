import React from "react";
import { AuthorBadge } from "aihappey-components";

export default {
  title: "Badges/AuthorBadge",
  component: AuthorBadge,
};

export const Default = (args) => React.createElement(AuthorBadge, args);

Default.args = {
  author: "Example Author",
};

export const ShortName = () =>
  React.createElement(AuthorBadge, {
    author: "A",
  });

export const LongName = () =>
  React.createElement(AuthorBadge, {
    author: "Very Long Author Name That Should Still Fit Nicely",
  });

export const Empty = () =>
  React.createElement(AuthorBadge, {
    author: "",
  });