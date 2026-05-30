import type { Provider } from "aihappey-types";

export const regoloai: Provider = {
  name: "RegoloAI",
  description:
    "Experience Data Privacy First infrastructure. Scalable, enterprise-grade LLM APIs hosted in Europe with Zero Data Retention. Secure your AI workflows.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://regolo.ai&size=128",
    },
  ],
  urls: {
    homepage: "https://regolo.ai",
    docs: "https://docs.regolo.ai",
    pricing: "https://regolo.ai/pricing",
    termsOfService: "https://regolo.ai/terms-and-conditions",
    privacyPolicy: "https://regolo.ai/privacy-policy",
    console: "https://dashboard.regolo.ai"
  },
  providerCountry: "IT",
  category: "inference_compute",
  inferenceRegions: ["Europe"]
};

