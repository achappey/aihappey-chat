import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const TextAreaView = (props) => {
  const { TextArea } = useTheme();
  return React.createElement(TextArea, props);
};

export default {
  title: "TextArea",
  component: TextAreaView,
};

export const Default = {
  render: () => {
    const [val, setVal] = useState("");
    return React.createElement(TextAreaView, {
        value: val,
        onChange: (e) => setVal(e.target ? e.target.value : e),
        label: "Comments",
        rows: 4
    });
  }
};
