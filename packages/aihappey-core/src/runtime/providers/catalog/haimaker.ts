import type { Provider } from "aihappey-types";

export const haimaker: Provider = {
  name: "Haimaker",
  description: "Access 200+ AI models through a single OpenAI-compatible endpoint. Find the best model for cost, intelligence, or speed.",
  icons: [
    {
      src: "https://www.google.com/s2/favicons?sz=128&domain=haimaker.ai"
    }
  ],
  urls: {
    homepage: "https://haimaker.ai",
    docs: "https://docs.haimaker.ai",
    console: "https://app.haimaker.ai",
    privacyPolicy: "https://haimaker.ai/privacy-policy",
    termsOfService: "https://haimaker.ai/terms-and-conditions"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

