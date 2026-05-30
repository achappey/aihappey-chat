import type { Provider } from "aihappey-types";

export const vultr: Provider = {
  name: "Vultr",
  description: "Instantly run machine learning models with serverless inference. Scale on demand, reduce costs, and eliminate infrastructure management.",
  icons: [{
    src: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/vultr.webp"
  }],
  urls: {
    homepage: "https://www.vultr.com",
    docs: "https://api.vultrinference.com",
    pricing: "https://www.vultr.com/pricing",
    privacyPolicy: "https://www.vultr.com/legal/privacy",
    termsOfService: "https://www.vultr.com/legal/tos"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

