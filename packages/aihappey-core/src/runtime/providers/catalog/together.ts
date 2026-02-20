import type { Provider } from "aihappey-types";

export const together: Provider = {
  name: "Together",
  description:
    "Reliably build, deploy, and scale AI native apps — benefit from cutting-edge research, complete developer experience, and unmatched price-performance.",
  icons: [
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/together-color.png",
      theme: "light"
    },
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/together-color.png",
      theme: "dark"
    },
  ],
  urls: {
    homepage: "https://www.together.ai",
    docs: "https://docs.together.ai",
    console: "https://api.together.ai"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};