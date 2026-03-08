import type { Provider } from "aihappey-types";

export const tavily: Provider = {
  name: "Tavily",
  description: "Connect your AI agents to the web. Real-time search, extraction, research, and web crawling through a single, secure API.",
  icons: [
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/tavily-color.png"
    }
  ],
  urls: {
    homepage: "https://www.tavily.com",
    docs: "https://docs.tavily.com",
    pricing: "https://www.tavily.com/pricing",
    console: "https://app.tavily.com",
    privacyPolicy: "https://www.tavily.com/privacy",
    termsOfService: "https://www.tavily.com/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

