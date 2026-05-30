import type { Provider } from "aihappey-types";

export const realrouter: Provider = {
  name: "Realrouter",
  description: "Subscription access to OpenAI-compatible API keys and a mobile chat app, powered by one shared monthly Realrouter credit balance.",
  icons: [{
    src: "https://realrouter.org/icon.svg"
  }],
  urls: {
    homepage: "ttps://realrouter.org",
    docs: "https://realrouter.org/docs",
    pricing: "https://realrouter.org/pricing",
    privacyPolicy: "https://realrouter.org/privacy",
    termsOfService: "https://realrouter.org/terms"
  },
  providerCountry: "CA",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

