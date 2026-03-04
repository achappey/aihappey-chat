import type { Provider } from "aihappey-types";

export const siliconflow: Provider = {
  name: "SiliconFlow",
  description:
    "Lightning-fast AI platform for developers. Deploy, fine-tune, and run 200+ optimized LLMs and multimodal models with simple APIs - SiliconFlow.",
  icons: [
    {
      src: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/siliconcloud-color.png",
    },
  ],
  urls: {
    homepage: "https://www.siliconflow.com",
    pricing: "https://www.siliconflow.com/pricing",
    docs: "https://docs.siliconflow.com",
    privacyPolicy: "https://docs.siliconflow.com/en/legals/privacy-policy",
    termsOfService: "https://docs.siliconflow.com/en/legals/terms-of-service",
    console: "https://cloud.siliconflow.com"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

