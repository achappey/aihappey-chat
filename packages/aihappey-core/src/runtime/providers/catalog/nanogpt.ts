import type { Provider } from "aihappey-types";

export const nanogpt: Provider = {
  name: "NanoGPT",
  description: "Explore the potential of AI with NanoGPT - pay per prompt. Get instant access to over 200+ powerful AI models. No subscriptions. No registration required.",
  icons: [
    {
      src: "https://nano-gpt.com/landing/favicon.ico"
    }
  ],
  urls: {
    homepage: "https://nano-gpt.com",
    docs: "https://nano-gpt.com/api",
    termsOfService: "https://nano-gpt.com/legal/terms-of-service",
    pricing: "https://nano-gpt.com/pricing",
    privacyPolicy: "https://nano-gpt.com/legal/privacy-policy"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

