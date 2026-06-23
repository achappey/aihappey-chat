// .storybook/preview.tsx
import React from "react";
import type { Preview } from "@storybook/react";
import { ThemeProvider as BootstrapThemeProvider } from "aihappey-theme-bootstrap";
import { ThemeProvider as ChakraThemeProvider } from "aihappey-theme-chakra";
import { ThemeProvider as FluentThemeProvider } from "aihappey-theme-fluent";
import { ThemeProvider as MantineThemeProvider } from "aihappey-theme-mantine";
import { ThemeProvider as MaterialThemeProvider } from "aihappey-theme-material";
import { ThemeProvider as ShadcnThemeProvider } from "aihappey-theme-shadcn";

const ConfiguredShadcnThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ShadcnThemeProvider defaultPresetId="tailwind:neutral">{children}</ShadcnThemeProvider>
);

const themeProviders = {
  bootstrap: BootstrapThemeProvider,
  chakra: ChakraThemeProvider,
  fluent: FluentThemeProvider,
  material: MaterialThemeProvider,
  mantine: MantineThemeProvider,
  shadcn: ConfiguredShadcnThemeProvider,
} as const;

type ThemeId = keyof typeof themeProviders;

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      defaultValue: "shadcn",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "bootstrap", title: "Bootstrap" },
          { value: "chakra", title: "Chakra" },
          { value: "fluent", title: "Fluent" },
          { value: "material", title: "Material" },
          { value: "mantine", title: "Mantine" },
          { value: "shadcn", title: "Shadcn" },
        ],
      },
    },
  },

  decorators: [
    (Story, context) => {
      const themeId = context.globals.theme as ThemeId | undefined;
      const Provider = themeProviders[themeId ?? "shadcn"] ?? ConfiguredShadcnThemeProvider;

      return React.createElement(Provider, null, Story());
    },
  ],
};

export default preview;
