import type { Provider } from "aihappey-types";

export const google: Provider = {
  name: "Google",
  description:
    "Discover how Google AI is committed to enriching knowledge, solving complex challenges and helping people grow by building useful AI tools and technologies.",
  icons: [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/2048px-Google-gemini-icon.svg.png",
    },
  ],
  urls: {
    homepage: "https://ai.google",
    docs: "https://ai.google.dev",
    privacyPolicy: "https://policies.google.com/privacy",
    termsOfService: "https://policies.google.com/terms",
    console: "https://aistudio.google.com"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

