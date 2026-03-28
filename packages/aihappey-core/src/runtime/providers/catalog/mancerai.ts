import type { Provider } from "aihappey-types";

export const mancerai: Provider = {
  name: "MancerAI",
  description:
    "No filters. No guidelines. No constraints. As an AI language model, sanitizing the output of generative models is infantilizing, unhealthy, and a colossal waste of human effort. So don't bother. You're an adult. Prompt responsibly.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mancer.tech&size=128"
    }
  ],
  urls: {
    homepage: "https://mancer.tech",
    docs: "https://mancer.tech/docs-api",
    termsOfService: "https://mancer.tech/terms",
    privacyPolicy: "https://mancer.tech/privacy"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};