import type { Provider } from "aihappey-types";

export const deepseek: Provider = {
  name: "DeepSeek",
  description: "DeepSeek, unravel the mystery of AGI with curiosity. Answer the essential question with long-termism.",
  icons: [
    {
      src: "https://images.seeklogo.com/logo-png/61/1/deepseek-ai-icon-logo-png_seeklogo-611473.png",
    },
  ],
  urls: {
    homepage: "https://www.deepseek.com",
    docs: "https://platform.deepseek.com/docs",
    privacyPolicy: "https://www.deepseek.com/privacy",
    termsOfService: "https://www.deepseek.com/terms"
  },
  providerCountry: "CN",
  category: "model_provider",
  inferenceRegions: ["World"]

};

