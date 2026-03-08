import type { Provider } from "aihappey-types";

export const vidu: Provider = {
  name: "Vidu",
  description: "Create studio-quality images and video with Vidu AI. Fast, high-quality, and affordable for creators, marketers, and teams.",
  icons: [
    {
      src: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/vidu-color.png"
    }
  ],
  urls: {
    homepage: "https://www.vidu.com",
    pricing: "https://www.vidu.com/pricing",
    privacyPolicy: "https://www.vidu.com/privacy",
    termsOfService: "https://www.vidu.com/terms"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

