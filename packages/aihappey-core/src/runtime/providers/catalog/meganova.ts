import type { Provider } from "aihappey-types";

export const meganova: Provider = {
  name: "MegaNova",
  description:
    "MegaNova is an AI-driven chat and AI agent platform that provides access to a rich collection of over 100 advanced generative models for text, images, audio, and video. Designed for immersive storytelling, character interaction, and creative expression, Mega Nova delivers a seamless, high-performance experience through a unified API and modern, customizable chat interface.",
  icons: [
    {
      src: "https://pbs.twimg.com/profile_images/1975056965773799425/XdSENWc-.jpg"
    }
  ],
  urls: {
    homepage: "https://www.meganova.ai",
    docs: "https://docs.meganova.ai",
    termsOfService: "https://docs.meganova.ai/legal-docs/terms-of-service",
    privacyPolicy: "https://docs.meganova.ai/legal-docs/privacy-policy",
    console: "https://console.meganova.ai"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};