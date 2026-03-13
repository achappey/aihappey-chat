import type { Provider } from "aihappey-types";

export const gatewayz: Provider = {
  name: "Gatewayz",
  description: "Stop six-figure inference bills. Intelligent routing across 10,000+ AI models delivers 20-40% cost reduction, zero vendor lock-in, and centralized governance for engineering leaders.",
  icons: [{
    src: "https://www.gatewayz.ai/gatewayz-logo-white.png",
    theme: "dark",
  }, {
    src: "https://www.gatewayz.ai/gatewayz-logo-black.png",
    theme: "light",
  }],

  urls: {
    homepage: "https://www.gatewayz.ai",
    docs: "https://docs.gatewayz.ai",
    pricing: "https://www.gatewayz.ai/pricing",
    privacyPolicy: "https://www.gatewayz.ai/privacy",
    termsOfService: "https://www.gatewayz.ai/terms-of-service"
  },
  providerCountry: "CA",
  inferenceRegions: ["World"]

};

