import type { Provider } from "aihappey-types";

export const mljunction: Provider = {
  name: "MLJunction",
  description: "A capability-aware multi-provider LLM gateway: one canonical API, safe fallbacks, governance and a trust receipt on every request.",
  urls: {
    homepage: "https://mljunction.com",
    docs: "https://mljunction.com/docs",
    pricing: "https://mljunction.com/pricing",
    privacyPolicy: "https://mljunction.com/privacy",
    termsOfService: "https://mljunction.com/terms"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

