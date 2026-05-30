import type { Provider } from "aihappey-types";

export const resembleai: Provider = {
  name: "ResembleAI",
  description:
    "Resemble AI | Create AI voices and stop deepfakes with models built for enterprise scale and security.",
  icons: [{
    src: "https://pbs.twimg.com/profile_images/1496504056436727818/Flpn3gIT_400x400.jpg"
  }],
  urls: {
    homepage: "https://www.resemble.ai",
    docs: "https://docs.resemble.ai",
    pricing: "https://www.resemble.ai/pricing",
    privacyPolicy: "https://www.resemble.ai/privacy",
    termsOfService: "https://www.resemble.ai/terms"
  },
  providerCountry: "CA",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

