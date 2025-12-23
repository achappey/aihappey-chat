import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const TabsView = (props) => {
  const { Tabs, Tab } = useTheme();
  const [key, setKey] = useState("tab1");
  
  return React.createElement(Tabs, {
      ...props,
      activeKey: key,
      onSelect: (k) => setKey(k)
  }, 
    React.createElement(Tab, { eventKey: "tab1", title: "Tab 1" }, "Content for Tab 1"),
    React.createElement(Tab, { eventKey: "tab2", title: "Tab 2" }, "Content for Tab 2")
  );
};

export default {
  title: "Tabs",
  component: TabsView,
};

export const Default = {
  render: () => React.createElement(TabsView, {})
};
