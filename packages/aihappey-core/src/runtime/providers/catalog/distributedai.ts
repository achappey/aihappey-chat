import type { Provider } from "aihappey-types";

export const distributedai: Provider = {
  name: "DistributedAI",
  description: "DistributeAI is a distributed compute network that connects providers to consumers for running curated open-source models.",
  icons: [{
    src: "https://static.images.dropstab.com/images/oasis-ai.jpg"
  }],
  urls: {
    homepage: "https://www.distribute.ai",
    docs: "https://docs.distribute.ai",
    pricing: "https://wisdom-gate.juheapi.com/pricing",
    privacyPolicy: "https://www.distribute.ai/legal/privacy",
    termsOfService: "https://www.distribute.ai/legal/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

