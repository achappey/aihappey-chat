import React from "react";
import { FileAttachmentCard } from "aihappey-components";

export default {
  title: "Cards/FileAttachmentCard",
  component: FileAttachmentCard,
};

const pdfFile = {
  id: "file-1",
  type: "file",
  url: "https://example.com/document.pdf",
  mediaType: "application/pdf",
};

const imageFile = {
  id: "file-2",
  type: "file",
  url: "https://via.placeholder.com/150",
  mediaType: "image/png",
};

const base64File = {
  id: "file-3",
  type: "file",
  // Small 1x1 transparent PNG
  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  mediaType: "image/png",
};

export const Pdf = () =>
  React.createElement(FileAttachmentCard, {
    file: pdfFile,
  });

export const Image = () =>
  React.createElement(FileAttachmentCard, {
    file: imageFile,
  });

export const Base64Image = () =>
  React.createElement(FileAttachmentCard, {
    file: base64File,
  });
