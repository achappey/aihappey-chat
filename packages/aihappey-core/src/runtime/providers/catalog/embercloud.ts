import type { Provider } from "aihappey-types";

export const embercloud: Provider = {
  name: "EmberCloud",
  description: "Serverless GPU inference for open source models. Zero cold starts. Millisecond latency. Affordable tokens at blazing fast speeds.",
  icons: [{
    src: "https://pbs.twimg.com/profile_images/2024677596462792704/UMZ_5miq_400x400.jpg"
  }],
  urls: {
    homepage: "https://www.embercloud.ai",
    docs: "https://www.embercloud.ai/docs",
    pricing: "https://www.embercloud.ai/pricing",
    privacyPolicy: "https://www.embercloud.ai/privacy",
    termsOfService: "https://www.embercloud.ai/terms"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

