import type { Provider } from "aihappey-types";

export const schatziai: Provider = {
  name: "SchatziAI",
  description: "Swiss-hosted AI infrastructure with green energy. Zero data retention, FADP compliant, and powered by open-source models. Your data stays in the Alps.",
  icons: [{
    src: "https://schatziai.ch/logo/apple-touch-icon.png"
  }],
  urls: {
    homepage: "https://schatziai.ch",
    docs: "https://docs.schatziai.ch",
    pricing: "https://schatziai.ch/pricing",
    privacyPolicy: "https://schatziai.ch/privacy-policy",
    termsOfService: "https://schatziai.ch/terms-conditions"
  },
  providerCountry: "CH",
  inferenceRegions: ["Europe"]

};

