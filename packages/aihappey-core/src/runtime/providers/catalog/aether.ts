import type { Provider } from "aihappey-types";

export const aether: Provider = {
  name: "Aether",
  description: "Access OpenAI, Anthropic, Google, and more through a single unified API. 30% cheaper with 99.95% uptime.",
  icons: [{
    src: "https://media.licdn.com/dms/image/v2/C4D0BAQF8YXeixagD2w/company-logo_200_200/company-logo_200_200/0/1647495932803/aether_industries_limited_logo?e=2147483647&v=beta&t=cfF7fgYZrQtdYjefqAU9p4Gn0F8frqjrTsQvS7NvpY0"
  }],
  urls: {
    homepage: "https://aetherapi.dev",
    docs: "https://aetherapi.dev/#docs",
    pricing:"https://aetherapi.dev/pricing",
    privacyPolicy: "https://aetherapi.dev/privacy",
    termsOfService: "https://aetherapi.dev/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

