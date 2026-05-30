import type { Provider } from "aihappey-types";

export const iapp: Provider = {
  name: "iApp",
  description: "iApp Technology - Thailand's leading AI company. Enterprise-grade APIs for Thai OCR, eKYC, speech-to-text, LLM, face verification & NLP. Trusted by 100+ companies, 50M+ API calls. ISO certified, PDPA compliant.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJpius3xWKLMTf4iid_lUIStJJ1Hm7-qO0CQ&s"
  }],
  urls: {
    homepage: "https://iapp.co.th",
    docs: "https://iapp.co.th/docs",
    pricing: "https://iapp.co.th/pricing",
    privacyPolicy: "https://iapp.co.th/pdpa",
    termsOfService: "https://iapp.co.th/terms-and-conditions"
  },
  providerCountry: "TH",
  category: "search_data",
  inferenceRegions: ["World"]

};

