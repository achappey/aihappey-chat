import type { Provider } from "aihappey-types";

export const infercom: Provider = {
  name: "Infercom",
  description: "EU sovereign AI inference platform. Up to 10x faster inference powered by SambaNova dataflow architecture. GDPR compliant, hosted in EU.",
  icons: [{
    src: "https://infercom.ai/favicon.png"
  }],
  urls: {
    homepage: "https://infercom.ai",
    docs: "https://docs.infercom.ai",
    pricing: "https://infercom.ai/pricing",
    privacyPolicy: "https://infercom.ai/privacypolicy",
    termsOfService: "https://infercom.ai/termsconditions"
  },
  providerCountry: "LU",
  category: "inference_compute",
  inferenceRegions: ["Europe"]

};

