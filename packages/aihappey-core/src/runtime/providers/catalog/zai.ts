import type { Provider } from "aihappey-types";

export const zai: Provider = {
  name: "Zai",
  description:
    "Z.ai provides OpenAI-compatible APIs for large language models developed by Zhipu AI, including the GLM model family, with a focus on efficient inference and developer-friendly integration.",
  icons: [{
    src: "https://avatars.githubusercontent.com/u/223098841?s=200&v=4"
  }],
  urls: {
    homepage: "https://z.ai/model-api",
    docs: "https://docs.z.ai",
    pricing: "https://docs.z.ai/guides/overview/pricing",
    privacyPolicy: "https://docs.z.ai/legal-agreement/privacy-policy",
    termsOfService: "https://docs.z.ai/legal-agreement/terms-of-use"
  },
  providerCountry: "CN",
  category: "model_provider",
  inferenceRegions: ["World"]

};

