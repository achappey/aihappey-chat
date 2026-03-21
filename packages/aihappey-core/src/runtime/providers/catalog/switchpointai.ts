import type { Provider } from "aihappey-types";

export const switchpointai: Provider = {
  name: "SwichpointAI",
  description: "Switchpoint AI offers a custom LLM routing solution that cuts costs, boosts performance, and guarantees full data privacy with zero vendor lock-in. Get started with our intelligent routing engine.",
  icons: [{
    src: "https://www.switchpoint.dev/favicon.ico"
  }],
  urls: {
    homepage: "https://www.switchpoint.dev",
    docs: "https://www.switchpoint.dev/docs",
    pricing: "https://www.switchpoint.dev/#pricing",
    privacyPolicy: "https://www.switchpoint.dev/privacy",
    termsOfService: "https://www.switchpoint.dev/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

