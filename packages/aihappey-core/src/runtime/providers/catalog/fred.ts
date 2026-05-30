import type { Provider } from "aihappey-types";

export const fred: Provider = {
  name: "Fred",
  description: "Fred is an agentic coding CLI for the terminal. DeepSeek-powered, permission-aware, pay-per-token. uv tool install fredcode and ship.",
  icons: [{
    src: "https://www.fredcode.net/icon"
  }],
  urls: {
    homepage: "https://www.fredcode.net",
    docs: "https://www.fredcode.net/docs",
    pricing: "https://www.fredcode.net/pricing",
    privacyPolicy: "https://www.fredcode.net/privacy",
    termsOfService: "https://www.fredcode.net/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

