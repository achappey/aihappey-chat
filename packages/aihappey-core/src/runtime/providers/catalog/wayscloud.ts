import type { Provider } from "aihappey-types";

export const wayscloud: Provider = {
  name: "WAYSCloud",
  description: "WAYSCloud is a European cloud platform built in the Nordics. Full control, no vendor lock-in, and transparent infrastructure for businesses across Europe.",
  urls: {
    homepage: "https://wayscloud.eu",
    console: "https://my.wayscloud.services",
    docs: "https://docs.wayscloud.services",
    privacyPolicy: "https://wayscloud.eu/legal/privacy",
    termsOfService: "https://wayscloud.eu/legal/terms"
  },
  providerCountry: "NO",
  category: "inference_compute",
  inferenceRegions: ["Europe"]

};

