import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  addons: ["@storybook/addon-webpack5-compiler-swc"],
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
};

export default config;
