import type { Provider } from "aihappey-types";

export const opencode: Provider = {
  name: "OpenCode",
  description:
    "The open source AI coding agent. Free models included or connect any model from any provider, including Claude, GPT, Gemini and more.",
  icons: [
    {
      src: "https://ph-files.imgix.net/c8b3ba9e-e0e9-42d4-ad46-42566610e39f.svg?auto=format",
    },
  ],
  urls: {
    homepage: "https://opencode.ai",
    docs: "https://opencode.ai/docs",
    privacyPolicy: "https://opencode.ai/legal/privacy-policy",
    termsOfService: "https://opencode.ai/legal/terms-of-service"
  },
  providerCountry: "US",
  inferenceRegions: ["Americas"]

};

