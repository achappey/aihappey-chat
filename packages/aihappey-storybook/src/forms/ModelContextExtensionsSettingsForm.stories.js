import React, { useState } from "react";
import { ModelContextExtensionsSettingsForm } from "aihappey-components";

export default {
  title: "Forms/ModelContextExtensionsSettingsForm",
  component: ModelContextExtensionsSettingsForm,
};

const Wrapper = (props) => {
  const [value, setValue] = useState(
    props.value || {
      enableApps: false,
      enableAgentImport: false,
      enableConversationImport: false,
    }
  );

  return React.createElement(ModelContextExtensionsSettingsForm, {
    ...props,
    value,
    onToggleApps: (enabled) => setValue((prev) => ({ ...prev, enableApps: enabled })),
    onToggleAgentImport: (enabled) =>
      setValue((prev) => ({ ...prev, enableAgentImport: enabled })),
    onToggleConversationImport: (enabled) =>
      setValue((prev) => ({ ...prev, enableConversationImport: enabled })),
  });
};

/**
 * ALL OFF — minimal surface
 */
export const AllOff = () => React.createElement(Wrapper, {});

/**
 * ALL ON — full surface enabled
 */
export const AllOn = () =>
  React.createElement(Wrapper, {
    value: {
      enableApps: true,
      enableAgentImport: true,
      enableConversationImport: true,
    },
  });

/**
 * MIXED — common config
 */
export const Mixed = () =>
  React.createElement(Wrapper, {
    value: {
      enableApps: true,
      enableAgentImport: false,
      enableConversationImport: true,
    },
  });

/**
 * TRANSLATIONS + HINTS — exercise hint rendering
 */
export const WithTranslationsAndHints = () =>
  React.createElement(Wrapper, {
    value: {
      enableApps: false,
      enableAgentImport: true,
      enableConversationImport: false,
    },
    translations: {
      appsLabel: "Enable apps",
      agentImportLabel: "Allow importing agents",
      agentImportHint: "Enable to import agent definitions from files.",
      conversationImportLabel: "Allow importing conversations",
      conversationImportHint: "Enable to import saved chats and transcripts.",
    },
  });

/**
 * INTERACTIVE — toggle switches via UI
 */
export const Interactive = () =>
  React.createElement(Wrapper, {
    value: {
      enableApps: true,
      enableAgentImport: true,
      enableConversationImport: false,
    },
  });

