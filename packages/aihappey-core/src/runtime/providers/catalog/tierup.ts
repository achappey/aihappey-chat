import type { Provider } from "aihappey-types";

export const tierup: Provider = {
  name: "TierUp",
  description: "An affordable, OpenAI-compatible AI API. Pick a performance tier; TierUp routes to the best LLM at flat prices ~50% below retail.",
  icons: [{
    src: "https://tierup.ai/icon-192.png"
  }],
  urls: {
    homepage: "https://tierup.ai",
    docs: "https://tierup.ai/docs",
    privacyPolicy: "https://tierup.ai/privacy",
    termsOfService: "https://tierup.ai/terms"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]
};

