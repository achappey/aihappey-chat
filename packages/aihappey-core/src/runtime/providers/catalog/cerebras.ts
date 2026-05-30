import type { Provider } from "aihappey-types";

export const cerebras: Provider = {
  name: "Cerebras",
  description: "Cerebras is the go-to platform for fast and effortless AI training.",
  icons: [
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/cerebras-color.png",
    },
  ],
  urls: {
    homepage: "https://www.cerebras.ai",
    docs: "https://docs.cerebras.ai",
    pricing: "https://www.cerebras.ai/pricing",
    privacyPolicy: "https://www.cerebras.ai/privacy-policy",
    termsOfService: "https://www.cerebras.ai/other-terms-and-policies"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]
};

