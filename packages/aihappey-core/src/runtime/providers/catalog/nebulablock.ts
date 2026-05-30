import type { Provider } from "aihappey-types";

export const nebulablock: Provider = {
  name: "NebulaBlock",
  description: "Nebula Block delivers on-demand and reserved GPUs, serverless AI and cloud storage so teams can build and scale AI faster, anywhere.",
  icons: [{
    src: "https://www.nebulablock.com/favicon.ico?favicon.621ee697.ico"
  }],
  urls: {
    homepage: "https://www.nebulablock.com",
    docs: "https://docs.nebulablock.com",
    pricing: "https://www.nebulablock.com/pricing/serverless-ai",
    privacyPolicy: "https://docs.nebulablock.com/overview-3/privacy_policy",
    termsOfService: "https://docs.nebulablock.com/overview-3/terms_of_service"
  },
  providerCountry: "CA",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

