import type { Provider } from "aihappey-types";

export const tensorix: Provider = {
  name: "Tensorix",
  description: "The radically simple platform for private AI inference. Zero data retention. EU-sovereign infrastructure. Access MiniMax, GLM-5, Llama 3, DeepSeek and more with transparent pricing.",
  icons: [{
    src: "https://media.licdn.com/dms/image/v2/D4D0BAQHG5uQlSgoWNw/company-logo_200_200/B4DZukf7BfKcAI-/0/1767991390900/tensorix_logo?e=2147483647&v=beta&t=0i2g-vdKdy-v-H9Zu2CR5RGaU5LyteRbdrqQ8Kcov_c"
  }],
  urls: {
    homepage: "https://tensorix.ai",
    docs: "https://docs.tensorix.ai",
    pricing: "https://tensorix.ai/pricing",
    privacyPolicy: "https://tensorix.ai/privacy",
    termsOfService: "https://tensorix.ai/terms"
  },
  providerCountry: "IE",
  category: "inference_compute",
  inferenceRegions: ["Europe"]

};

