import type { Provider } from "aihappey-types";

export const mistral: Provider = {
  name: "Mistral",
  description:
    "The most powerful AI platform for enterprises. Customize, fine-tune, and deploy AI assistants, autonomous agents, and multimodal AI with open models.",
  icons: [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mistral_AI_logo_%282025%E2%80%93%29.svg/1200px-Mistral_AI_logo_%282025%E2%80%93%29.svg.png",
    },
  ],
  urls: {
    homepage: "https://mistral.ai",
    docs: "https://docs.mistral.ai",
    privacyPolicy: "https://legal.mistral.ai/terms/privacy-policy",
    termsOfService: "https://legal.mistral.ai/terms",
    console: "https://console.mistral.ai"
  },
  providerCountry: "FR",
  inferenceRegions: ["World"]

};

