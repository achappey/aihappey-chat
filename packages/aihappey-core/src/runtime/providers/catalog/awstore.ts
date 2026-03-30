import type { Provider } from "aihappey-types";

export const awstore: Provider = {
  name: "AWstore",
  description: "Claude-compatible API access with transparent Anthropic-equivalent billing. Built for SDKs, editors, agents, and automation.",
  icons: [{
    src: "https://kiro.cheap/icon.svg?icon.8520381b.svg"
  }],
  urls: {
    homepage: "https://kiro.cheap",
    docs: "https://kiro.cheap/#api",
    pricing: "https://kiro.cheap/#pricing",
    privacyPolicy: "https://kiro.cheap/privacy",
    termsOfService: "https://kiro.cheap/terms"
  },
  inferenceRegions: ["World"]
};

