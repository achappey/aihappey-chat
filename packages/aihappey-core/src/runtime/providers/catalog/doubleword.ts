import type { Provider } from "aihappey-types";

export const doubleword: Provider = {
  name: "Doubleword",
  description: "Doubleword is the Inference Cloud for the largest volume use cases. Offering 75% cheaper inference for long running, high volume async and high throughput inference.",
  icons: [{
    src: "https://doubleword.ai/favicon.png"
  }],
  urls: {
    homepage: "https://doubleword.ai",
    docs: "https://docs.doubleword.ai",
    pricing: "https://doubleword.ai/pricing",
    privacyPolicy: "https://doubleword.ai/privacy",
    termsOfService: "https://doubleword.ai/terms-of-service"
  },
  providerCountry: "GB",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

