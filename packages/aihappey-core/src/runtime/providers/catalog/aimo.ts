import type { Provider } from "aihappey-types";

export const aimo: Provider = {
  name: "AiMo",
  description: "AiMo Network is a decentralized AI marketplace that provides permissionless access to hundreds of AI models through a single, OpenAI-compatible API. Pay only for what you use with transparent, blockchain-based payments using the X402 protocol—a decentralized pay-per-use system built on Solana and Base that eliminates traditional payment intermediaries.",
  icons: [{
    src: "https://aimo.network/icon.png?icon.00f73686.png"
  }],
  urls: {
    homepage: "https://aimo.network",
    docs: "https://docs.aimo.network",
    privacyPolicy: "https://docs.aimo.network/overview/privacy-policy",
    termsOfService: "https://docs.aimo.network/overview/terms-of-service"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

