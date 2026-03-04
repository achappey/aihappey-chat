import type { Provider } from "aihappey-types";

export const anthropic: Provider = {
  name: "Anthropic",
  description:
    "Anthropic is an AI safety and research company that's working to build reliable, interpretable, and steerable AI systems.",
  icons: [{ src: "https://upload.wikimedia.org/wikipedia/commons/1/14/Anthropic.png" }],
  urls: {
    homepage: "https://www.anthropic.com",
    docs: "https://docs.claude.com",
    console: "https://platform.claude.com",
    pricing: "https://platform.claude.com/docs/en/about-claude/pricing",
    privacyPolicy: "https://privacy.claude.com",
    termsOfService: "https://www.anthropic.com/legal/commercial-terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

