import type { Provider } from "aihappey-types";

export const pollinations: Provider = {
  name: "Pollinations",
  experimental: true,
  description: "AI creation playground - Generate images, text & audio with open source models.",
  icons: [
    {
      src: "https://avatars.githubusercontent.com/u/86964862?v=4",
      theme: "dark",
    },
    {
      src: "https://images.seeklogo.com/logo-png/61/2/pollinations-icon-logo-png_seeklogo-611686.png",
      theme: "light",
    },
  ],
  urls: {
    homepage: "https://pollinations.ai",
    docs: "https://pollinations.ai/docs",
    privacyPolicy: "https://pollinations.ai/privacy",
    termsOfService: "https://pollinations.ai/terms"
  },
  providerCountry: "DE",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

