import type { Provider } from "aihappey-types";

export const moonshot: Provider = {
  name: "Moonshot",
  description:
    "Moonshot AI is committed to solving ambitious moonshot problems that will lead humanity to AGI.",
  icons: [
    {
      src: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/moonshot.png",
      theme: "light"
    },
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/moonshot.png",
      theme: "dark"
    },
  ],
  url: "https://www.moonshot.ai",
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

