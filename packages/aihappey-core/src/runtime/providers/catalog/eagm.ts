import type { Provider } from "aihappey-types";

export const eagm: Provider = {
  name: "EAGM",
  description: "Professional API Gateway providing unified access to Claude, GPT, Gemini, and Grok models. Enterprise-grade reliability, security, and performance with a single API key.",
  icons: [{
    src: "https://api.eagmgroup.com/img/fav.ico"
  }],
  urls: {
    homepage: "https://eagmgroup.com",
    docs: "https://api.eagmgroup.com/docs",
    pricing: "https://api.eagmgroup.com/pricing",
    privacyPolicy: "https://api.eagmgroup.com/legal-policies#privacy-policy",
    termsOfService: "https://api.eagmgroup.com/legal-policies"
  },
  providerCountry: "GB",
  inferenceRegions: ["World"]

};

