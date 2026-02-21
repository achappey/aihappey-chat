import type { Provider } from "aihappey-types";

export const runpod: Provider = {
  name: "Runpod",
  description: "AI infrastructure with on-demand GPUs and serverless compute. Run training, inference, and batch workloads on the cloud with Runpod.",
  icons: [
    {
      src: "https://avatars.githubusercontent.com/u/95939477?s=200&v=4"
    }
  ],
  urls: {
    homepage: "https://www.runpod.io",
    docs: "https://docs.runpod.io",
    privacyPolicy: "https://www.runpod.io/legal/privacy-policy",
    termsOfService: "https://www.runpod.io/legal/terms-of-service",
    console: "https://console.runpod.io"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

