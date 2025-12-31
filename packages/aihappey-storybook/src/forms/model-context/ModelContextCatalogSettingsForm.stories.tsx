import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ModelContextCatalogSettingsForm } from "aihappey-components";

type ModelContextCatalogSettings = {
  quickSearches: string[];
};

const Wrapper = ({
  initialValue,
}: {
  initialValue?: ModelContextCatalogSettings;
  translations?: {
    label?: string;
    placeholder?: string;
    add?: string;
  };
}) => {
  const [value, setValue] = useState<ModelContextCatalogSettings>(
    initialValue ?? { quickSearches: [] }
  );

  const onAdd = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;

    setValue((prev) =>
      prev.quickSearches.includes(trimmed)
        ? prev
        : { quickSearches: [...prev.quickSearches, trimmed] }
    );
  };

  const onRemove = (tag: string) => {
    setValue((prev) => ({
      quickSearches: prev.quickSearches.filter((t) => t !== tag),
    }));
  };

  return (
    <ModelContextCatalogSettingsForm
      value={value}
      onAdd={onAdd}
      onRemove={onRemove}
    />
  );
};

const meta: Meta<typeof ModelContextCatalogSettingsForm> = {
  title: "Forms/Model Context/ModelContextCatalogSettingsForm",
  component: ModelContextCatalogSettingsForm,
};

export default meta;
type Story = StoryObj<typeof ModelContextCatalogSettingsForm>;

/**
 * EMPTY — no quick searches
 */
export const Empty: Story = {
  render: () => <Wrapper />,
};

/**
 * WITH TAGS — typical values
 */
export const WithTags: Story = {
  render: () => (
    <Wrapper
      initialValue={{
        quickSearches: ["docs", "how-to", "release-notes"],
      }}
    />
  ),
};

/**
 * LONG / EDGE TAGS — exercises rendering + wrapping
 */
export const LongTags: Story = {
  render: () => (
    <Wrapper
      initialValue={{
        quickSearches: [
          "a-very-very-long-tag-that-should-wrap-or-truncate",
          "with spaces",
          "punctuation:!@#$%^&*()_+-=",
        ],
      }}
    />
  ),
};

/**
 * INTERACTIVE — add/remove tags via UI
 */
export const Interactive: Story = {
  render: () => (
    <Wrapper
      initialValue={{
        quickSearches: ["example"],
      }}
    />
  ),
};
