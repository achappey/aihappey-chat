import type { Provider } from "aihappey-types";

export const keyplex: Provider = {
  name: "Keyplex",
  description: "One API key to access GPT, Claude, Gemini, Grok, Mistral and more. Fixed monthly pricing for developers.",
  icons: [{
    src: "https://keyplex.ai/images/favicon.png"
  }],
  urls: {
    homepage: "https://keyplex.ai",
    docs: "https://keyplex.ai/documentation",
    pricing: "https://keyplex.ai/#pricing",
    privacyPolicy: "https://keyplex.ai/privacy",
    termsOfService: "https://keyplex.ai/terms"
  },
  providerCountry: "HK",
  inferenceRegions: ["World"]

};

