import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { BraveChatConfigForm } from "aihappey-components";

const meta: Meta<typeof BraveChatConfigForm> = {
  title: "Forms/Providers/Brave/BraveChatConfigForm",
  component: BraveChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof BraveChatConfigForm>;

type WrapperProps = {
  config?: Record<string, unknown>;
};

const Wrapper: React.FC<WrapperProps> = ({ config }) => {
  const [state, setState] = useState<Record<string, unknown>>(config ?? {});

  return <BraveChatConfigForm config={state} updateConfig={setState} />;
};

export const Empty: Story = {
  render: () => <Wrapper />,
};

export const WebSearchWithLocation: Story = {
  render: () => (
    <Wrapper
      config={{
        web_search_options: {
          search_context_size: "medium",
          user_location: {
            type: "approximate",
            approximate: {
              city: "Amsterdam",
              country: "NL",
              region: "Noord-Holland",
              timezone: "Europe/Amsterdam",
            },
          },
        },
      }}
    />
  ),
};

export const EnrichedAnswers: Story = {
  render: () => (
    <Wrapper
      config={{
        country: "us",
        language: "en",
        safesearch: "moderate",
        enable_entities: true,
        enable_citations: true,
      }}
    />
  ),
};

export const ResearchMode: Story = {
  render: () => (
    <Wrapper
      config={{
        enable_research: true,
        research_allow_thinking: true,
        research_maximum_number_of_tokens_per_query: 4096,
        research_maximum_number_of_queries: 12,
        research_maximum_number_of_iterations: 4,
        research_maximum_number_of_seconds: 120,
        research_maximum_number_of_results_per_query: 10,
      }}
    />
  ),
};

export const FullyLoaded: Story = {
  render: () => (
    <Wrapper
      config={{
        seed: 42,
        country: "nl",
        language: "en",
        safesearch: "moderate",
        web_search_options: {
          search_context_size: "high",
          user_location: {
            type: "approximate",
            approximate: {
              city: "Amsterdam",
              country: "NL",
              region: "Noord-Holland",
              timezone: "Europe/Amsterdam",
            },
          },
        },
        enable_entities: true,
        enable_citations: true,
        enable_research: true,
        research_allow_thinking: true,
        research_maximum_number_of_tokens_per_query: 4096,
        research_maximum_number_of_queries: 8,
        research_maximum_number_of_iterations: 3,
        research_maximum_number_of_seconds: 90,
        research_maximum_number_of_results_per_query: 10,
      }}
    />
  ),
};

