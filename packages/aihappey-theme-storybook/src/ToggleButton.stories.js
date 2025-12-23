import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const ToggleButtonView = (props) => {
  const { ToggleButton } = useTheme();
  return React.createElement(ToggleButton, props);
};

export default {
  title: "ToggleButton",
  component: ToggleButtonView,
};

export const Default = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return React.createElement(ToggleButtonView, {
        checked: checked,
        onClick: () => setChecked(!checked)
    }, "Toggle Me");
  }
};
