import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const SearchBoxView = (props) => {
  const { SearchBox } = useTheme();
  return React.createElement(SearchBox, props);
};

export default {
  title: "SearchBox",
  component: SearchBoxView,
};

export const Default = {
  render: () => {
    const [val, setVal] = useState("");
    return React.createElement(SearchBoxView, {
        value: val,
        onChange: (e) => setVal(e.target ? e.target.value : e),
        placeholder: "Search..."
    });
  }
};
