import React, { useState } from "react";
import { LocalToolsSettingsForm } from "aihappey-components";

export default {
  title: "Forms/LocalToolsSettingsForm",
  component: LocalToolsSettingsForm,
};

const Wrapper = (props) => {
  const [value, setValue] = useState(
    props.value || {
      localConversationTools: true,
      localSettingsTools: false,
      localAgentTools: true,
      localMcpTools: false,
    }
  );
  return React.createElement(LocalToolsSettingsForm, {
    ...props,
    value: value,
    onChange: setValue,
  });
};

export const Default = () =>
  React.createElement(Wrapper, {});

export const WithTitle = () =>
  React.createElement(Wrapper, {
    formTitle: "Local Tools",
  });

export const SingleColumn = () =>
  React.createElement(Wrapper, {
    columns: 1,
  });
