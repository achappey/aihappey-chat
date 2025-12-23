import React from "react";
import { useTheme } from "aihappey-components";

const ImageView = (props) => {
  const { Image } = useTheme();
  return React.createElement(Image, props);
};

export default {
  title: "Image",
  component: ImageView,
};

export const Default = {
  render: () => React.createElement(ImageView, {
    src: "https://via.placeholder.com/150",
    width: 150,
    height: 150,
    fit: "cover",
  })
};
