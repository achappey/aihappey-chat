import React from "react";
import { useTheme } from "aihappey-components";

const CardView = (props) => {
  const { Card } = useTheme();
  return React.createElement(Card, props);
};

export default {
  title: "Card",
  component: CardView,
};

export const Default = {
  render: () => {
    const { Button, Image } = useTheme();
    return React.createElement(CardView, {
      title: "Default Card",
      size: "medium",
      text: "This is a default medium card.",
      description: "Standard card description.",
      actions: React.createElement(Button, {}, "Action"),
      image: React.createElement(Image, {
        src: "https://placehold.co/600x400",
        width: 64,
        alt: "placeholder",
      }),
      style: { width: 300 }
    });
  }
};

export const Small = {
  render: () => {
    return React.createElement(CardView, {
      title: "Small Card",
      size: "small",
      text: "Compact content.",
      description: "Small size description.",
      style: { width: 200 }
    });
  }
};

export const Large = {
  render: () => {
    const { Button, Image } = useTheme();

    return React.createElement(CardView, {
      title: "Large Card",
      size: "large",
      text: "This is a larger card intended for more prominent content presentation.",
      description: "Detailed description for the large card variant.",
      actions: React.createElement("div", { style: { display: 'flex', gap: '8px' } },
        React.createElement(Button, {}, "Accept"),
        React.createElement(Button, {}, "Decline")
      ),
      image: React.createElement(Image, {
        src: "https://placehold.co/600x400",
        width: 64,
        alt: "placeholder",
      }),
      style: { width: 400 }
    });
  }
};

export const WithHeaderActions = {
  render: () => {
    const { Button } = useTheme();

    return React.createElement(CardView, {
      title: "Card with Header Actions",
      size: "medium",
      text: "Notice the actions in the top right corner.",
      headerActions: React.createElement("div", {},
        React.createElement(Button, { style: { marginRight: '5px' } }, "Edit"),
        React.createElement(Button, {}, "Close")
      ),
      style: { width: 350 }
    });
  }
};

export const Complex = {
  render: () => {
    const { Button, Image } = useTheme();
    return React.createElement(CardView, {
      title: "Complex Card",
      size: "medium",
      description: "A card utilizing all available slots.",
      text: "Here is the main body text of the card. It can contain longer content.",
      image: React.createElement(Image, {
        src: "https://placehold.co/600x400",
        width: 64,
        alt: "placeholder"
      }),
      actions: React.createElement(Button, {}, "Primary Action"),
      headerActions: React.createElement("span", { style: { color: 'gray', cursor: 'pointer' } }, "•••"),
      style: { width: 350 }
    });
  }
};
