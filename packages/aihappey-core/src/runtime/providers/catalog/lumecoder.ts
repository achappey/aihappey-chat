import type { Provider } from "aihappey-types";

export const lumecoder: Provider = {
  name: "Lumecoder",
  description: "Claude Code mirror access for China—no proxy needed. Alipay/WeChat supported, transparent billing with no multipliers, fully API-compatible with the official service.",
  icons: [{
    src: "https://lumecoder.com/favicon.ico"
  }],
  urls: {
    homepage: "https://lumecoder.com",
    docs: "https://lumecoder.com/docs",
    pricing: "https://lumecoder.com/pricing",
    privacyPolicy: "https://lumecoder.com/privacy",
    termsOfService: "https://lumecoder.com/terms"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

