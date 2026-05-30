import type { Provider } from "aihappey-types";

export const mulerun: Provider = {
  name: "MuleRun",
  description: "Let AI work harder so you work smarter.",
  icons: [{
    src: "https://mulerun.com/assets/image/logo.png"
  }],
  urls: {
    homepage: "https://mulerun.com",
    docs: "https://mulerun.com/docs",
    console: "https://mulerun.com/creator/studio",
    pricing: "https://mulerun.com/pricing",
    privacyPolicy: "https://mulerun.com/docs/legal/user-privacy-policy",
    termsOfService: "https://mulerun.com/docs/legal/user-terms-of-use"
  },
  providerCountry: "SG",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

