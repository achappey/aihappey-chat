import type { Provider } from "aihappey-types";

export const webcrawlerapi: Provider = {
  name: "WebCrawlerAPI",
  description: "Crawl docs, help centers, and websites into clean markdown for your AI support agent. Handles JS, CAPTCHAs, and proxies automatically. Pay per page, no subscription.",
  icons: [{
    src: "https://webcrawlerapi.com/images/logo.svg",
    theme: "light"
  },
  {
    src: "https://webcrawlerapi.com/images/logo_transparent.png",
    theme: "dark"
  }],
  urls: {
    homepage: "https://webcrawlerapi.com",
    docs: "https://webcrawlerapi.com/docs/getting-started",
    pricing: "https://webcrawlerapi.com/#pricing",
    privacyPolicy: "https://webcrawlerapi.com/privacy",
    termsOfService: "https://webcrawlerapi.com/tos"
  },
  providerCountry: "NL",
  inferenceRegions: ["World"]

};

