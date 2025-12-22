import React from "react";
import { AuthorBadges } from "aihappey-components";

export default {
  title: "Badges/AuthorBadges",
  component: AuthorBadges,
};

export const None = () =>
  React.createElement(AuthorBadges, {
    authors: [],
  });

export const One = () =>
  React.createElement(AuthorBadges, {
    authors: ["Example Author"],
  });

export const Many = () =>
  React.createElement(AuthorBadges, {
    authors: ["Alice", "Bob", "Charlie", "Dana"],
  });

export const WithEmptyValues = () =>
  React.createElement(AuthorBadges, {
    authors: ["Alice", "", "Bob"],
  });