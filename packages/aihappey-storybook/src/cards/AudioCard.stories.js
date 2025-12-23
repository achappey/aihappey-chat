import React from "react";
import { AudioCard } from "aihappey-components";

export default {
  title: "Cards/AudioCard",
  component: AudioCard,
};

const audioBlock = {
  type: "audio",
  mimeType: "audio/wav",
  // Minimal 1 second silent wav base64
  data: "UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
};

export const Default = () =>
  React.createElement(AudioCard, {
    block: audioBlock,
  });
