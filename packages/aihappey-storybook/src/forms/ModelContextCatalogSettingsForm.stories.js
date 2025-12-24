import React, { useState } from "react";
import { ModelContextCatalogSettingsForm } from "aihappey-components";

export default {
  title: "Forms/ModelContextCatalogSettingsForm",
  component: ModelContextCatalogSettingsForm,
};

const Wrapper = (props) => {
  const [value, setValue] = useState(
    props.value || {
      quickSearches: [],
    }
  );

  const onAdd = (tag) => {
    const trimmed = (tag || "").trim();
    if (!trimmed) return;

    setValue((prev) => {
      const prevTags = prev?.quickSearches ?? [];
      if (prevTags.includes(trimmed)) return prev;
      return {
        ...prev,
        quickSearches: [...prevTags, trimmed],
      };
    });
  };

  const onRemove = (tag) => {
    setValue((prev) => ({
      ...prev,
      quickSearches: (prev?.quickSearches ?? []).filter((t) => t !== tag),
    }));
  };

  return React.createElement(ModelContextCatalogSettingsForm, {
    ...props,
    value,
    onAdd,
    onRemove,
  });
};

/**
 * EMPTY — no quick searches
 */
export const Empty = () => React.createElement(Wrapper, {});

/**
 * WITH TAGS — typical values
 */
export const WithTags = () =>
  React.createElement(Wrapper, {
    value: {
      quickSearches: ["docs", "how-to", "release-notes"],
    },
  });

/**
 * TRANSLATIONS — label + placeholder + add text
 */
export const WithTranslations = () =>
  React.createElement(Wrapper, {
    value: {
      quickSearches: ["architecture"],
    },
    translations: {
      label: "Quick searches",
      placeholder: "Add a query tag…",
      add: "Add",
    },
  });

/**
 * LONG / EDGE TAGS — exercises rendering + wrapping
 */
export const LongTags = () =>
  React.createElement(Wrapper, {
    value: {
      quickSearches: [
        "a-very-very-long-tag-that-should-wrap-or-truncate",
        "with spaces",
        "punctuation:!@#$%^&*()_+-=",
      ],
    },
  });

/**
 * INTERACTIVE — add/remove tags via UI
 */
export const Interactive = () =>
  React.createElement(Wrapper, {
    value: {
      quickSearches: ["example"],
    },
  });

