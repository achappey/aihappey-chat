import type { Provider } from "aihappey-types";

export const hetzner: Provider = {
  name: "Hetzner",
  description: "Günstige Hosting-Lösungen, Dedicated Server und Cloud-Services bei Hetzner ✓ DSGVO-konform ✓ günstige Preise  ✓ 100 % grüne Energie.",
  urls: {
    homepage: "https://www.hetzner.com",
    docs: "https://experiments.hetzner.com/docs/inference",
    privacyPolicy: "https://www.hetzner.com/legal/privacy-policy",
    termsOfService: "https://www.hetzner.com/legal/terms-and-conditions",
    console: "https://experiments.hetzner.com"
  },
  providerCountry: "DE",
  category: "inference_compute",
  inferenceRegions: ["Europe"]

};

