import type { Provider } from "../providerMetadata";

export const openai: Provider = {
  name: "OpenAI",
  description:
    "We believe that our research will ultimately lead to artificial general intelligence, a system capable of solving problems at a human level. Our mission is to build safe and valuable AGI.",
  icons: [
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/openai.png",
      theme: "dark",
    },
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.74.0/files/light/openai.png",
      theme: "light",
    },
  ],
  url: "https://openai.com",
};

