import type { Provider } from "aihappey-types";

export const wisdomgate: Provider = {
  name: "WisdomGate",
  description: "Wisdom Gate is the unified interface for LLMs. Access OpenAI, Claude, Gemini, DeepSeek and more through one API. Pay-as-you-go pricing with transparent billing.",
  icons: [{
    src: "https://wisdom-gate.juheapi.com/favicon.ico"
  }],
  urls: {
    homepage: "https://wisdom-gate.juheapi.com",
    docs: "https://wisdom-docs.juheapi.com",
    privacyPolicy: "https://www.juheapi.com/docs/privacy-policy",
    termsOfService: "https://www.juheapi.com/docs/terms-of-service"
  },
  providerCountry: "HK",
  inferenceRegions: ["World"]

};

