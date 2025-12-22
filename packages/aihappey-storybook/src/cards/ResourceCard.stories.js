import React from "react";
import { ResourceCard } from "aihappey-components";

export default {
  title: "Cards/ResourceCard",
  component: ResourceCard,
  argTypes: {
    resource: {
      control: "object",
    }
  },
};

export const Default = (args) => React.createElement(ResourceCard, args);

Default.args = {
  resource: { uri: "https://www.nu.nl", name: "nu.nl", }
};
