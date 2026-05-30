import type { Provider } from "aihappey-types";

export const hyperstack: Provider = {
  name: "Hyperstack",
  description: "Run AI/ML workloads in minutes with Hyperstack’s on-demand cloud GPU solutions. Get optimal performance, transparent pricing and developer-friendly tools.",
  icons: [
    {
      src: "https://www.hyperstack.cloud/hubfs/hyperstack_2023/blog/plain.jpg"
    }
  ],
  urls: {
    homepage: "https://www.hyperstack.cloud",
    pricing: "https://www.hyperstack.cloud/gpu-pricing#studio-pricing",
    docs: "https://docs.hyperstack.cloud/docs/api-reference",
    privacyPolicy: "https://www.hyperstack.cloud/privacy-policy",
    termsOfService: "https://www.hyperstack.cloud/terms-and-conditions"
  },
  providerCountry: "GB",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

