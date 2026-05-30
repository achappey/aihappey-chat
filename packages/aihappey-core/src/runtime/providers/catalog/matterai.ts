import type { Provider } from "aihappey-types";

export const matterai: Provider = {
  name: "MatterAI",
  description: "AI Super Intelligence for general purpose tasks, code generation and deep research.",
  icons: [
    {
      src: "https://www.matterai.so/favicon.png"
    }
  ],
  urls: {
    homepage: "https://www.matterai.so",
    docs: "https://docs.matterai.so",
    privacyPolicy: "https://www.matterai.so/policy",
    termsOfService: "https://www.matterai.so/terms",
    console: "https://app.matterai.so"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]
};

