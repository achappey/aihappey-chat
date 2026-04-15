// OpenAIChatConfigForm.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { OpenAIChatConfigForm } from "aihappey-components";

const storySkillOptions = [
  {
    value: "openai/spreadsheets",
    label: "Spreadsheets (openai/spreadsheets)",
    skillId: "openai/spreadsheets",
    name: "Spreadsheets",
    description: "Analyze spreadsheet files",
    providerId: "openai",
    backendType: "reference" as const,
    referenceSkillId: "openai-spreadsheets",
  },
  {
    value: "local/pdf-reader",
    label: "PDF Reader (local/pdf-reader)",
    skillId: "local/pdf-reader",
    name: "PDF Reader",
    description: "Read and summarize PDF documents",
    providerId: "local",
    backendType: "inline" as const,
  },
];

const resolveStoryShellSkill = async (skillValue: string) => {
  if (skillValue === "openai/spreadsheets") {
    return {
      type: "skill_reference",
      skill_id: "openai-spreadsheets",
    };
  }

  if (skillValue === "local/pdf-reader") {
    return {
      type: "inline",
      name: "PDF Reader",
      description: "Read and summarize PDF documents",
      source: {
        type: "base64",
        media_type: "application/zip",
        data: "UEsDBAoAAAAAA",
      },
    };
  }

  return undefined;
};

type WrapperProps = {
  config?: any;
};

const Wrapper: React.FC<WrapperProps> = ({ config: initialConfig }) => {
  const [config, setConfig] = useState<any>(initialConfig ?? {});
  return (
    <OpenAIChatConfigForm
      config={config}
      openAISkillOptions={storySkillOptions}
      resolveOpenAIShellSkill={resolveStoryShellSkill}
      updateConfig={setConfig}
    />
  );
};

const meta: Meta<typeof OpenAIChatConfigForm> = {
  title: "Forms/Providers/OpenAI/OpenAIChatConfigForm",
  component: OpenAIChatConfigForm,
  render: (args) => <Wrapper {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Populated: Story = {
  args: {
    config: {
      reasoning: { effort: "medium", summary: "auto" },
      web_search: {
        search_context_size: "medium",
        filters: {
          allowed_domains: ["pubmed.ncbi.nlm.nih.gov", "openai.com"],
        },
        user_location: {
          country: "NL",
          region: "Noord-Holland",
          city: "Amsterdam",
          timezone: "Europe/Amsterdam",
          type: "approximate",
        },
      },
      include: ["web_search_call.action.sources"],
      image_generation: {
        model: "gpt-image-1",
        size: "1024x1024",
        quality: "medium",
        input_fidelity: "low",
        background: "auto",
        partial_images: 2,
      },
      code_interpreter: { container: { type: "auto" } },
      shell: {
        type: "shell",
        environment: {
          type: "container_auto",
          skills: [
            {
              type: "skill_reference",
              skill_id: "openai-spreadsheets",
            },
            {
              type: "inline",
              name: "PDF Reader",
              description: "Read and summarize PDF documents",
              source: {
                type: "base64",
                media_type: "application/zip",
                data: "UEsDBAoAAAAAA",
              },
            },
          ],
        },
      },
      truncation: "disabled",
      parallel_tool_calls: true,
      instructions: "Be concise.",
    },
  },
};
