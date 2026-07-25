import type { Provider } from "aihappey-types";

export const opencodezen: Provider = {
  name: "OpenCodeZen",
  description:
    "The open source AI coding agent. Free models included or connect any model from any provider, including Claude, GPT, Gemini and more.",
  icons: [
    {
      src: "https://ph-files.imgix.net/c8b3ba9e-e0e9-42d4-ad46-42566610e39f.svg?auto=format",
    },
  ],
  urls: {
    homepage: "https://opencode.ai",
    docs: "https://opencode.ai/docs/zen",
    privacyPolicy: "https://opencode.ai/legal/privacy-policy",
    termsOfService: "https://opencode.ai/legal/terms-of-service"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["Americas"],
  apiBaseUrl: "https://opencode.ai/zen",
  chatEndpoints: ["/v1/chat/completions", "/v1/responses", "/v1/messages"],

};

