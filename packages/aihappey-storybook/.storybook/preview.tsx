// .storybook/preview.tsx
import type { Preview } from "@storybook/react";
import { ThemeProvider as FluentThemeProvider } from "aihappey-theme-fluent";
import { ThemeProvider as BootstrapThemeProvider } from "aihappey-theme-bootstrap";
import { I18nProvider, languageNames } from "aihappey-i18n";

const languageItems = Object.entries(languageNames).map(z => ({
  value: z[0], title: z[1]
}))

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

    locale: {
      name: "Language",
      defaultValue: "en",
      toolbar: {
        icon: "globe",
        items: languageItems,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const ThemeProvider =
        context.globals.theme === "bootstrap"
          ? BootstrapThemeProvider
          : FluentThemeProvider;

      return (
        <ThemeProvider>
          <I18nProvider locale={context.globals.locale}>
            <Story />
          </I18nProvider>
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
