import type { Provider } from "aihappey-types";

export const nodion: Provider = {
  name: "Nodion",
  description: "European AI inference API for open-source models like Qwen 3.5. GDPR-compliant, hosted on Nordic green energy. OpenAI-compatible.",
  icons: [{
    src: "https://www.nodion.ai/favicon.ico"
  }],
  urls: {
    homepage: "https://www.nodion.ai",
    privacyPolicy: "https://www.nodion.ai/en/privacy/",
    termsOfService: "https://www.nodion.ai/en/terms"
  },
  providerCountry: "DE",
  category: "inference_compute",
  inferenceRegions: ["Europe"]

};

