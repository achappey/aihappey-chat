import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const SliderView = (props) => {
  const { Slider } = useTheme();
  return React.createElement(Slider, props);
};

export default {
  title: "Slider",
  component: SliderView,
};

export const Default = {
  render: () => {
    const [val, setVal] = useState(50);
    return React.createElement(SliderView, {
        value: val,
        onChange: (v) => setVal(v),
        min: 0,
        max: 100,
        step: 1,
        label: "Volume"
    });
  }
};
