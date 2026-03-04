import type { Provider } from "aihappey-types";

export const avian: Provider = {
  name: "Avian",
  description:
    "Fast AI inference billed per token. DeepSeek V3.2, Kimi K2.5, GLM-5, MiniMax M2.5 via OpenAI-compatible API.",
  icons: [
    {
      src: "https://pbs.twimg.com/profile_images/1546527736331649027/ZlspXiCL_400x400.jpg",
    },
  ],
  urls: {
    homepage: "https://avian.io",
    docs: "https://avian.io/docs",
    pricing: "https://avian.io/pricing",
    console: "https://avian.io/dashboard",
    privacyPolicy: "https://avian.io/privacy",
    termsOfService: "https://avian.io/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

