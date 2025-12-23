import React from "react";
import { MimeTypeBadge } from "aihappey-components";

export default {
  title: "Badges/MimeTypeBadge",
  component: MimeTypeBadge,
};

export const Pdf = () =>
  React.createElement(MimeTypeBadge, {
    mimeType: "application/pdf",
  });

export const Json = () =>
  React.createElement(MimeTypeBadge, {
    mimeType: "application/json",
  });

export const Image = () =>
  React.createElement(MimeTypeBadge, {
    mimeType: "image/png",
  });

export const WithTranslations = () =>
  React.createElement(MimeTypeBadge, {
    mimeType: "application/pdf",
    translations: {
      "application/pdf": "PDF Document",
    },
  });
