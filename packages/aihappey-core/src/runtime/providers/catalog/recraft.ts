import type { Provider } from "aihappey-types";

export const recraft: Provider = {
  name: "Recraft",
  description: "Recraft is a top-ranked text-to-image model and design platform for photorealism, vector generation, custom styles, mockups, and more.",
  icons: [
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/recraft.png",
      theme: "light"
    },
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/recraft.png",
      theme: "dark"
    }
  ],
  urls: {
    homepage: "https://www.recraft.ai",
    docs: "https://www.recraft.ai/docs",
    privacyPolicy: "https://www.recraft.ai/privacy",
    termsOfService: "https://www.recraft.ai/terms",
    console: "https://app.recraft.ai"
  },
  providerCountry: "GB",
  category: "model_provider",
  inferenceRegions: ["World"]

};

