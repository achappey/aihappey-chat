import type { Provider } from "aihappey-types";

export const requesty: Provider = {
  name: "Requesty",
  description: "Govern and optimize your LLMs with Requesty's unified gateway. Enterprise-grade routing, governance controls, cost management, and 80% savings for AI teams.",
  icons: [
    {
      src: "https://requesty.ai/favicon.ico"
    }
  ],
  urls: {
    homepage: "https://www.requesty.ai",
    docs: "https://docs.requesty.ai",
    pricing: "https://www.requesty.ai/pricing",
    privacyPolicy: "https://www.requesty.ai/privacy",
    termsOfService: "https://www.requesty.ai/terms",
    console: "https://app.requesty.ai"
  },
  providerCountry: "GB",
  category: "gateway_router",
  inferenceRegions: ["Asia", "Europe", "Americas"],
  apiBaseUrl: "https://router.eu.requesty.ai",
  chatEndpoints: ["/v1/chat/completions", "/v1/responses", "/v1/messages"],
};

