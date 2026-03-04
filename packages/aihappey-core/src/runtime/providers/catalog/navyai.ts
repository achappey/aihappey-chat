import type { Provider } from "aihappey-types";

export const navyai: Provider = {
  name: "NavyAI",
  description: "A single API to access state-of-the-art models from OpenAI, Google, Mistral, and more.",
  icons: [
    {
      src: "https://api.navy/assets/navyai.png"
    }
  ],
  urls: {
    homepage: "https://api.navy",
    docs: "https://api.navy/docs",
    pricing: "https://api.navy/pricing",
    termsOfService: "https://api.navy/terms",
    privacyPolicy: "https://api.navy/privacy"
  },
  inferenceRegions: ["World"]
};

