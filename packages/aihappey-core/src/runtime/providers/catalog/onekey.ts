import type { Provider } from "aihappey-types";

export const onekey: Provider = {
  name: "OneKey",
  description: "Access OpenAI, Anthropic, Google, and xAI models with a single API key. Prepaid credits, no subscriptions.",
  icons: [{
    src: "https://1key4ai.com/favicon.ico"
  }],
  urls: {
    homepage: "https://1key4ai.com",
    console: "https://1key4ai.com/dashboard",
    pricing: "https://1key4ai.com/pricing",
    privacyPolicy: "https://1key4ai.com/privacy",
    termsOfService: "https://1key4ai.com/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

