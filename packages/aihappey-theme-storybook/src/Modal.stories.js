import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const ModalView = (props) => {
  const { Modal, Button } = useTheme();
  const [show, setShow] = useState(false);
  
  return React.createElement(React.Fragment, {},
    React.createElement(Button, { onClick: () => setShow(true) }, "Open Modal"),
    React.createElement(Modal, {
      ...props,
      show: show,
      onHide: () => setShow(false),
      actions: React.createElement(Button, { onClick: () => setShow(false) }, "Close")
    }, props.children)
  );
};

export default {
  title: "Modal",
  component: ModalView,
};

export const Default = {
  render: () => React.createElement(ModalView, {
    title: "Modal Title",
    size: "medium"
  }, "Modal Content")
};
