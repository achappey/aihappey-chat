import React from "react";
import { useTheme } from "aihappey-components";

const SkeletonView = (props) => {
  const { Skeleton } = useTheme();
  return React.createElement(Skeleton, props);
};

export default {
  title: "Skeleton",
  component: SkeletonView,
};

export const Default = {
  render: () => React.createElement(SkeletonView, {
    width: 200,
    height: 20,
    animation: "wave"
  })
};
