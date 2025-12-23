import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const CarouselView = (props) => {
  const { Carousel } = useTheme();
  return React.createElement(Carousel, props);
};

export default {
  title: "Carousel",
  component: CarouselView,
};

export const Default = {
  render: () => {
    const [index, setIndex] = useState(0);
    return React.createElement(CarouselView, {
      activeIndex: index,
      onSelect: setIndex,
      slides: [
        { key: "1", content: React.createElement("div", { style: { height: 200, background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center" } }, "Slide 1") },
        { key: "2", content: React.createElement("div", { style: { height: 200, background: "#aaa", display: "flex", alignItems: "center", justifyContent: "center" } }, "Slide 2") },
        { key: "3", content: React.createElement("div", { style: { height: 200, background: "#888", display: "flex", alignItems: "center", justifyContent: "center" } }, "Slide 3") },
      ]
    });
  }
};
