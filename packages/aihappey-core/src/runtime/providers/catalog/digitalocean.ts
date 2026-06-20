import type { Provider } from "aihappey-types";

export const digitalocean: Provider = {
  name: "DigitalOcean",
  description: "Build on DigitalOcean's unified agentic AI cloud infrastructure. AI-powered development, instant deployment, easy management. Simple and affordable.",
  urls: {
    homepage: "https://www.digitalocean.com",
    docs: "https://docs.digitalocean.com",
    pricing: "https://www.digitalocean.com/pricing/gradient-platform",
    privacyPolicy: "https://www.digitalocean.com/legal/privacy-policy",
    termsOfService: "https://www.digitalocean.com/legal/terms-of-service-agreement",
    console: "https://cloud.digitalocean.com"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]
};

