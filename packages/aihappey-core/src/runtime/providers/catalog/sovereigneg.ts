import type { Provider } from "aihappey-types";

export const sovereigneg: Provider = {
  name: "SovereignEG",
  description:
    "OpenAI-compatible AI inference API for Egypt and MENA — chat and embedding models billed in EGP, enterprise controls, and an Egypt-hosted sovereign deployment track.",
  urls: {
    homepage: "https://sovereigneg.com",
    docs: "https://sovereigneg.com/docs",
    pricing:"https://sovereigneg.com/#pricing",
    privacyPolicy: "https://sovereigneg.com/legal/privacy",
    termsOfService: "https://sovereigneg.com/legal/terms"
  },
  providerCountry: "EG",
  category: "gateway_router",
  inferenceRegions: ["World"]
};

