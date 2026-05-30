import type { Provider } from "aihappey-types";

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
  urls: {
    homepage: "https://openai.com",
    docs: "https://platform.openai.com/docs",
    pricing: "https://openai.com/api/pricing",
    privacyPolicy: "https://openai.com/policies/privacy-policy",
    termsOfService: "https://openai.com/policies/terms-of-use",
    console: "https://platform.openai.com"
  },
  providerCountry: "US",
  category: "model_provider",
  inferenceRegions: ["World"]

};

