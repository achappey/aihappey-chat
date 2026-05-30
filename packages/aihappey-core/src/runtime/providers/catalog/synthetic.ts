import type { Provider } from "aihappey-types";

export const synthetic: Provider = {
  name: "Synthetic",
  description: "Run open-source AI, privately. We run open-source AI models for you in private, secure datacenters. We never train on your data, and we never store API prompts or completions.",
  icons: [{
    src: "https://synthetic.new/logo_with_text_bottom_512.png"
  }],
  urls: {
    homepage: "https://synthetic.new",
    docs: "https://dev.synthetic.new/docs/api/overview",
    pricing: "https://synthetic.new/pricing",
    privacyPolicy: "https://synthetic.new/policies/privacy",
    termsOfService: "https://synthetic.new/policies/terms-of-service"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

