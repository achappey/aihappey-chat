import type { Provider } from "aihappey-types";

export const logicosllmhub: Provider = {
  name: "LogicosLLMHub",
  description: "One API for 200+ models from OpenAI, Anthropic, Google, and more.",
  icons: [{
    src: "https://www.llmhub.one/_next/image?url=%2F2x%2Fdarkmode_logo%402x-8.png&w=640&q=75"
  }],
  urls: {
    homepage: "https://www.llmhub.one",
    docs: "https://www.llmhub.one/docs",
    pricing: "https://www.llmhub.one/#pricing",
    privacyPolicy: "https://www.llmhub.one/privacy",
    termsOfService: "https://www.llmhub.one/terms"
  },
  providerCountry: "NL",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

