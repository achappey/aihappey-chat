import React from "react";
import { useTheme } from "aihappey-components";

const TagsView = (props) => {
  const { Tags } = useTheme();
  return React.createElement(Tags, props);
};

export default {
  title: "Tags",
  component: TagsView,
};

export const Default = {
  render: () => React.createElement(TagsView, {
    items: [
        { key: "1", label: "Tag 1" },
        { key: "2", label: "Tag 2" }
    ],
    onRemove: (id) => alert("Remove " + id)
  })
};
