import React from "react";
import { useTheme } from "aihappey-components";

const BreadcrumbView = (props) => {
  const { Breadcrumb } = useTheme();
  return React.createElement(Breadcrumb, props);
};

export default {
  title: "Breadcrumb",
  component: BreadcrumbView,
};

export const Default = {
  render: () => React.createElement(BreadcrumbView, {
    items: [
      { key: "home", label: "Home", onClick: () => alert("Home") },
      { key: "section", label: "Section", onClick: () => alert("Section") },
      { key: "page", label: "Page" }
    ],
    size: "medium"
  })
};
