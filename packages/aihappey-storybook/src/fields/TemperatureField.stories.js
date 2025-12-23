import React, { useState } from "react";
import { TemperatureField } from "aihappey-components";

export default {
  title: "Fields/TemperatureField",
  component: TemperatureField,
};

const Wrapper = (props) => {
  const [value, setValue] = useState(props.value || 0.7);
  return React.createElement(TemperatureField, {
    ...props,
    value: value,
    onChange: setValue,
  });
};

export const Default = () =>
  React.createElement(Wrapper, {
    value: 0.7,
  });

export const Precise = () =>
  React.createElement(Wrapper, {
    value: 0.1,
  });

export const Creative = () =>
  React.createElement(Wrapper, {
    value: 1.0,
  });
