import type { Provider } from "aihappey-types";

export const augure: Provider = {
  name: "Augure",
  description: "Enterprise-grade intelligence. Full data sovereignty. Compliant with Quebec Law 25 and federal requirements—without compromising capability.",
  icons: [{
    src: "https://augureai.ca/favicon.ico?favicon.d6a0a5d8.ico"
  }],
  urls: {
    homepage: "https://augureai.ca",
    docs: "https://augureai.ca/developers",
    pricing: "https://augureai.ca/#pricing",
    privacyPolicy: "https://augureai.ca/privacy",
    termsOfService: "https://augureai.ca/terms"
  },
  providerCountry: "CA",
  category: "model_provider",
  inferenceRegions: ["World"]

};

