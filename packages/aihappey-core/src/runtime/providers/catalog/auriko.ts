import type { Provider } from "aihappey-types";

export const auriko: Provider = {
  name: "Auriko",
  description: "One API to switch LLM models across providers and reduce inference cost. Zero price markup, quant-trading grade optimization. Ship faster, spend less, stay reliable.",
  icons: [{
    src: "https://www.auriko.ai/icon.svg"
  }],
  urls: {
    homepage: "https://www.auriko.ai",
    docs: "https://docs.auriko.ai",
    pricing: "https://www.auriko.ai/pricing",
    privacyPolicy: "https://www.auriko.ai/privacy",
    termsOfService: "https://www.auriko.ai/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

