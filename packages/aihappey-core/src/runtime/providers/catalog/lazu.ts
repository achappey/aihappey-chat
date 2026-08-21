import type { Provider } from "aihappey-types";

export const lazu: Provider = {
  name: "Lazu",
  description: "Everyon's AI calls run through lazu: hand out per-person quota, issue API keys, and see exactly who spent what.",
  icons: [{
    src: "https://dubrify.com/favicon-32x32.png"
  }],
  urls: {
    homepage: "https://lazu.ai",
    docs: "https://docs.lazu.ai",
    console:"https://lazu.ai/console",
    privacyPolicy: "https://lazu.ai/privacy-policy",
    termsOfService: "https://lazu.ai/user-agreement"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

