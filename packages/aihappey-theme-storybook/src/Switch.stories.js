import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const SwitchView = (props) => {
  const { Switch } = useTheme();
  return React.createElement(Switch, props);
};

export default {
  title: "Switch",
  component: SwitchView,
};

export const Default = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return React.createElement(SwitchView, {
        id: "switch-1",
        label: "Enable Feature",
        checked: checked,
        onChange: (v) => setChecked(v)
    });
  }
};
