import type { Provider } from "aihappey-types";

export const knoxchat: Provider = {
  name: "KnoxChat",
  description: "Enterprise AI Service Platform — Unified access to 300+ AI models with intelligent routing, self-healing failover, and unlimited context memory. Powered by Rust.",
  icons: [{
    src: "https://knox.chat/favicon.ico?favicon.6a2b28ef.ico"
  }],
  urls: {
    homepage: "https://knox.chat",
    docs: "https://docs.knox.chat",
    privacyPolicy: "https://docs.knox.chat/privacy-policy",
    termsOfService: "https://docs.knox.chat/terms-of-service"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

