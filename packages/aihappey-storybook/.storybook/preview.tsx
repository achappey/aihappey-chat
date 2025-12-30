// .storybook/preview.tsx
import React from "react";
import type { Preview } from "@storybook/react";
import { ThemeProvider as FluentThemeProvider } from "aihappey-theme-fluent";
import { ThemeProvider as BootstrapThemeProvider } from "aihappey-theme-bootstrap";

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      defaultValue: "fluent",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "fluent", title: "Fluent" },
          { value: "bootstrap", title: "Bootstrap" },
        ],
      },
    },
  },

  decorators: [
    (Story, context) => {
      const Provider =
        context.globals.theme === "bootstrap"
          ? BootstrapThemeProvider
          : FluentThemeProvider;

      return React.createElement(Provider, null, Story());
    },
  ],
};

export default preview;
