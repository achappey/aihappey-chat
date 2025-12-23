import React, { useState } from "react";
import { ThrottlingField } from "aihappey-components";

export default {
  title: "Fields/ThrottlingField",
  component: ThrottlingField,
};

const Wrapper = (props) => {
  const [value, setValue] = useState(props.value || 0);
  return React.createElement(ThrottlingField, {
    ...props,
    value: value,
    onChange: setValue,
  });
};

export const Default = () =>
  React.createElement(Wrapper, {
    value: 0,
  });

export const Slow = () =>
  React.createElement(Wrapper, {
    value: 500,
  });

export const Max = () =>
  React.createElement(Wrapper, {
    value: 1000,
  });
