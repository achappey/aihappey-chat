import type { Provider } from "aihappey-types";

export const canrouter: Provider = {
  name: "CanRouter",
  description:
    "Access leading AI models through one OpenAI-compatible API. The cheapest AI model access — cheap, per-token pricing for developers, startups, and businesses.",
  urls: {
    homepage: "https://www.canrouter.ai", 
    docs: "https://www.canrouter.ai/documentation",
    pricing: "https://www.canrouter.ai/pricing",
    privacyPolicy: "https://www.canrouter.ai/privacy",
    termsOfService: "https://www.canrouter.ai/terms"
  },
  providerCountry: "CA",
  category: "gateway_router",
  inferenceRegions: ["World"]
};