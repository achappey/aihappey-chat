import type { Provider } from "aihappey-types";

export const edenai: Provider = {
  name: "EdenAI",
  description:
    "Access the best AI models through one unified API. Integrate OpenAI, Google, Anthropic, Mistral AI & more. Compare performance, monitor costs, and switch providers instantly.",
  icons: [
    {
      src: "https://meta-q.cdn.bubble.io/cdn-cgi/image/w=,h=,f=auto,dpr=1,fit=contain/f1680187367069x814617384157327800/edenlogowebclip.png"
    }
  ],
  urls: {
    homepage: "https://www.edenai.co",
    docs: "https://docs.edenai.co",
    pricing: "https://www.edenai.co/pricing",
    privacyPolicy: "https://www.edenai.co/privacy-policy",
    termsOfService: "https://www.edenai.co/terms-conditions"
  },
  providerCountry: "FR",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

