
import React from "react";
import { DataCard } from "aihappey-components";

export default {
  title: "Cards/DataCard",
  component: DataCard,
  argTypes: {
    type: {
      control: "text",
    },
    data: {
      control: "object",
    }
  },
};

export const Default = (args) => React.createElement(DataCard, args);

Default.args = {
  type: "example",
  data: { hello: "world" },
};
