import type { Provider } from "aihappey-types";

export const rebytemodels: Provider = {
  name: "RebyteModels",
  description: "rebyte is where you hire a team of digital employees — agents on real cloud computers that build, ship, and operate software for you.",
  urls: {
    homepage: "https://rebyte.ai",
    docs: "https://rebyte.ai/docs",
    pricing: "https://rebyte.ai/pricing",
    termsOfService: "https://rebyte.ai/terms",
    privacyPolicy: "https://rebyte.ai/privacy",
    console: "https://app.rebyte.ai"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://model.rebyte.ai",
  chatEndpoints: ["/v1/chat/completions"],

};

