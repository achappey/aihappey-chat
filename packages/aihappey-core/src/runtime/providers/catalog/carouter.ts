import type { Provider } from "aihappey-types";

export const carouter: Provider = {
  name: "CARouter",
  description:
    "AI that answers from inside Canada. One endpoint. Canadian providers. Canadian soil.",
  urls: {
    homepage: "https://carouter.ai",
    docs: "https://carouter.ai/docs",
    pricing: "https://carouter.ai/#pricing",
    privacyPolicy: "https://carouter.ai/privacy",
    termsOfService: "https://carouter.ai/terms"
  },
  providerCountry: "CA",
  category: "gateway_router",
  inferenceRegions: ["Americas"]
};