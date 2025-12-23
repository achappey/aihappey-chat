import React from "react";
import { LimitedTextField } from "aihappey-components";

export default {
  title: "Fields/LimitedTextField",
  component: LimitedTextField,
};

const shortText = "This is a short text.";
const longText =
  "This is a very long text that should be truncated because it exceeds the number of lines specified in the component. We are testing if the ellipsis appears correctly and if the text is hidden as expected.";

export const Short = () =>
  React.createElement(LimitedTextField, {
    text: shortText,
  });

export const Long = () =>
  React.createElement(LimitedTextField, {
    text: longText,
  });

export const CustomRows = () =>
  React.createElement(LimitedTextField, {
    text: longText,
    rows: 1,
  });
