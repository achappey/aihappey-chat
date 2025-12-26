import React from "react";
import { ResourceLinkCard } from "aihappey-components";

export default {
  title: "Cards/ResourceLinkCard",
  component: ResourceLinkCard,
};

const imageLink = {
  uri: "https://via.placeholder.com/640x360",
  name: "Example image",
  mimeType: "image/png",
};

const audioLink = {
  uri: "https://www.w3schools.com/html/horse.ogg",
  name: "Example audio",
  mimeType: "audio/ogg",
};

const videoLink = {
  uri: "https://www.w3schools.com/html/mov_bbb.mp4",
  name: "Example video",
  mimeType: "video/mp4",
};

const unknownLink = {
  uri: "https://example.com/resource.bin",
  name: "Unknown content",
  mimeType: "application/octet-stream",
};

export const Image = () =>
  React.createElement(ResourceLinkCard, {
    block: imageLink,
  });

export const Audio = () =>
  React.createElement(ResourceLinkCard, {
    block: audioLink,
    translations: { noAudioSupport: "Your browser does not support audio." },
  });

export const Video = () =>
  React.createElement(ResourceLinkCard, {
    block: videoLink,
    translations: { noVideoSupport: "Your browser does not support video." },
  });

export const UnknownMime = () =>
  React.createElement(ResourceLinkCard, {
    block: unknownLink,
  });

