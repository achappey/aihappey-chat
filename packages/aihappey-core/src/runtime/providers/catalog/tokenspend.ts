import type { Provider } from "aihappey-types";

export const tokenspend: Provider = {
  name: "TokenSpend",
  description:
    "AI coding spend attributed to pull requests, teams, and orgs.",
  urls: {
    homepage: "https://tokenspend.dev",
    docs: "https://tokenspend.dev/docs/router",
    privacyPolicy: "https://tokenspend.dev/privacy",
    termsOfService: "https://tokenspend.dev/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]
};