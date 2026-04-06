import type { Provider } from "aihappey-types";

export const apipod: Provider = {
  name: "APIPod",
  description: "Access all pricing AI models with one API, support AI chat, video, image and music generation. Free API key, support multi-channel intelligent routing, automatic fault tolerance and flexible billing. And cheaper than Replicate and Fal.ai.",
  icons: [{
    src: "https://www.apipod.ai/logo.svg"
  }],
  urls: {
    homepage: "https://www.apipod.ai",
    pricing: "https://www.apipod.ai/pricing",
    docs: "https://docs.apipod.ai",
    privacyPolicy: "https://www.apipod.ai/privacy",
    termsOfService: "https://www.apipod.ai/terms"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

