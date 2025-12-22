import React from "react";
import { ThemeProvider as FluentThemeProvider } from "aihappey-theme-fluent";
import { ThemeProvider as BootstrapThemeProvider } from "aihappey-theme-bootstrap";

export const globalTypes = {
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
};

const preview = {
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
