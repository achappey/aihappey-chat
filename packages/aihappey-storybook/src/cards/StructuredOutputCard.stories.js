import React from "react";
import { StructuredOutputCard } from "aihappey-components";

export default {
  title: "Cards/StructuredOutputCard",
  component: StructuredOutputCard,
};

const result = {
  toolCallId: "call_1",
  structuredContent: {
    name: "John Doe",
    age: 30,
    address: {
      city: "New York",
      zip: "10001",
    },
  },
};

export const Default = () =>
  React.createElement(StructuredOutputCard, {
    result: result,
  });

export const WithTitle = () =>
  React.createElement(StructuredOutputCard, {
    result: result,
    title: "User Profile",
  });
