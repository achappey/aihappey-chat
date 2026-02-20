import type { Provider } from "aihappey-types";

export const regoloai: Provider = {
  name: "RegoloAI",
  description:
    "Experience Data Privacy First infrastructure. Scalable, enterprise-grade LLM APIs hosted in Europe with Zero Data Retention. Secure your AI workflows.",
  icons: [
    {
      src: "https://regolo.ai/wp-content/themes/regolo/img/hero-image.png",
    },
  ],
  urls: {
    homepage: "https://regolo.ai",
    docs: "https://docs.regolo.ai",
    termsOfService: "https://regolo.ai/terms-and-conditions",
    privacyPolicy: "https://regolo.ai/privacy-policy",
    console: "https://dashboard.regolo.ai"
  },
  providerCountry: "IT",
  inferenceRegions: ["Europe"]
};

