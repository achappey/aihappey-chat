import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const SelectView = (props) => {
  const { Select } = useTheme();
  return React.createElement(Select, props);
};

export default {
  title: "Select",
  component: SelectView,
};

export const Default = {
  render: () => {
    const Controlled = () => {
      const [values, setValues] = useState(["1"]);
      return React.createElement(
        SelectView,
        {
          values,
          valueTitle: `Selected: ${values.join(", ")}`,
          placeholder: "Select an option",
          label: "Demo select",
          hint: "Toggle value and verify the current selection is visible",
          onChange: (v) => setValues([v]),
          children: [
            React.createElement(
              "option",
              { key: "1", value: "1" },
              "Option 1"
            ),
            React.createElement(
              "option",
              { key: "2", value: "2" },
              "Option 2"
            ),
          ],
        }
      );
    };

    return React.createElement(Controlled);
  }
};
