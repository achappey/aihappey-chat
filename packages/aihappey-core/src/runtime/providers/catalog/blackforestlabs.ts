import type { Provider } from "aihappey-types";

export const blackforestlabs: Provider = {
  name: "BlackForestLabs",
  description: "Black Forest Labs is the AI company behind FLUX, the state-of-the-art image generation model. Try FLUX.2, FLUX Kontext, and more via our API.",
  icons: [
    {
      src: "https://bfl.ai/brand/avoid/005.svg"
    }
  ],
  urls: {
    homepage: "https://bfl.ai",
    docs: "https://docs.bfl.ai",
    termsOfService: "https://bfl.ai/legal/terms-of-service",
    privacyPolicy: "https://bfl.ai/legal/privacy-policy",
    console: "https://dashboard.bfl.ai"
  },
  providerCountry: "DE",
  inferenceRegions: ["World"]
};

