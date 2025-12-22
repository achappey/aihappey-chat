import React from "react";
import { ModelCard } from "aihappey-components";

export default {
  title: "Cards/ModelCard",
  component: ModelCard,
};

const languageModel = {
  id: "gpt-4o-mini",
  name: "GPT-4o mini",
  type: "language",
  owned_by: "OpenAI",
  description: "A small, fast language model option for chat experiences.",
};

const embeddingModel = {
  id: "text-embedding-3-small",
  name: "Text Embedding 3 (small)",
  type: "embedding",
  owned_by: "OpenAI",
  description: "Embedding model example (no chat action expected).",
};

export const LanguageDefault = () =>
  React.createElement(ModelCard, {
    model: languageModel,
  });

export const LanguageWithImage = () =>
  React.createElement(ModelCard, {
    model: languageModel,
    image: "https://placehold.co/32x32?text=AI",
  });

export const LanguageWithChatAction = () =>
  React.createElement(ModelCard, {
    model: languageModel,
    image: "https://placehold.co/32x32?text=AI",
    onChat: () => {},
  });

export const NonLanguageNoChat = () =>
  React.createElement(ModelCard, {
    model: embeddingModel,
    onChat: () => {},
  });