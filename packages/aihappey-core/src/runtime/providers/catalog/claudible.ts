import type { Provider } from "aihappey-types";

export const claudible: Provider = {
  name: "Claudible",
  description: "Claudible - Premium Claude API for Claude Code with real-time dashboard.",
  icons: [{
    src: "https://claudible.io/shared/static/logo-dark.png",
    theme: "dark",
  }, {
    src: "https://claudible.io/shared/static/logo-light.png",
    theme: "light",
  }],

  urls: {
    homepage: "https://claudible.io",
    docs: "https://claudible.io/docs",
    pricing: "https://claudible.io/docs/pricing",
    privacyPolicy: "https://claudible.io/legal/privacy",
    termsOfService: "https://claudible.io/legal/terms"
  },
  providerCountry: "VN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

