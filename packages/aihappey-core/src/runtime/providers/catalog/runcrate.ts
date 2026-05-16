import type { Provider } from "aihappey-types";

export const runcrate: Provider = {
  name: "Runcrate",
  description: "Open-Access AI Cloud for everyone. Affordable GPU compute with instant access, no quotas or reservations.",
  icons: [{
    src: "https://www.runcrate.ai/apple-touch-icon.png"
  }],
  urls: {
    homepage: "https://www.runcrate.ai",
    docs: "https://www.runcrate.ai/docs",
    pricing: "https://www.runcrate.ai/pricing",
    privacyPolicy: "https://www.runcrate.ai/privacy",
    termsOfService: "https://www.runcrate.ai/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

