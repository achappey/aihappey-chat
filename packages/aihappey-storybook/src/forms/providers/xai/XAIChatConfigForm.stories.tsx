import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { XAIChatConfigForm } from "aihappey-components";

const meta: Meta<typeof XAIChatConfigForm> = {
  title: "Forms/Providers/XAI/XAIChatConfigForm",
  component: XAIChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof XAIChatConfigForm>;

type WrapperProps = {
  config?: Record<string, unknown>;
};

const Wrapper: React.FC<WrapperProps> = ({ config }) => {
  const [state, setState] = useState<Record<string, unknown>>(config ?? {});

  return (
    <XAIChatConfigForm
      config={state}
      updateConfig={setState}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Stories                                                             */
/* ------------------------------------------------------------------ */

export const Empty: Story = {
  render: () => <Wrapper />,
};

export const ReasoningOnly: Story = {
  render: () => (
    <Wrapper
      config={{
        reasoning: {
          effort: "medium",
          summary: "auto",
        },
      }}
    />
  ),
};

export const WebSearchEnabled: Story = {
  render: () => (
    <Wrapper
      config={{
        web_search: {
          enable_image_understanding: true,
          allowed_domains: ["openai.com", "x.ai"],
          excluded_domains: ["facebook.com"],
        },
      }}
    />
  ),
};

export const WebSearchRestricted: Story = {
  render: () => (
    <Wrapper
      config={{
        web_search: {
          enable_image_understanding: false,
          allowed_domains: ["gov.nl", "rijksoverheid.nl"],
          excluded_domains: [],
        },
      }}
    />
  ),
};

export const XSearchEnabled: Story = {
  render: () => (
    <Wrapper
      config={{
        x_search: {
          enable_image_understanding: true,
          enable_video_understanding: true,
          allowed_x_handles: ["@xai", "@elonmusk"],
          excluded_x_handles: ["@spam"],
        },
      }}
    />
  ),
};

export const XSearchRestricted: Story = {
  render: () => (
    <Wrapper
      config={{
        x_search: {
          enable_image_understanding: false,
          enable_video_understanding: false,
          allowed_x_handles: ["@openai"],
          excluded_x_handles: [],
        },
      }}
    />
  ),
};

export const CodeExecutionOnly: Story = {
  render: () => (
    <Wrapper
      config={{
        code_execution: {},
      }}
    />
  ),
};

export const ImageGenerationAuto: Story = {
  render: () => (
    <Wrapper
      config={{
        tools: [{ type: "image_generation", action: "auto" }],
      }}
    />
  ),
};

export const ImageGenerationEditOnly: Story = {
  render: () => (
    <Wrapper
      config={{
        tools: [{ type: "image_generation", action: "edit" }],
      }}
    />
  ),
};

export const ParallelToolsEnabled: Story = {
  render: () => (
    <Wrapper
      config={{
        parallel_tool_calls: true,
      }}
    />
  ),
};

export const FullyLoaded: Story = {
  render: () => (
    <Wrapper
      config={{
        include: ["reasoning.encrypted_content"],
        reasoning: {
          effort: "high",
          summary: "detailed",
        },
        tools: [
          {
            type: "web_search",
            enable_image_understanding: true,
            allowed_domains: ["x.ai", "openai.com"],
            excluded_domains: ["reddit.com"],
          },
          {
            type: "x_search",
            enable_image_understanding: true,
            enable_video_understanding: false,
            allowed_x_handles: ["@xai"],
            excluded_x_handles: ["@noise"],
          },
          { type: "image_generation", action: "generate" },
          { type: "code_execution" },
        ],
        parallel_tool_calls: true,
      }}
    />
  ),
};
