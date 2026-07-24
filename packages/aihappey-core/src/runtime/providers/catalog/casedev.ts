import type { Provider } from "aihappey-types";

export const casedev: Provider = {
  name: "CaseDev",
  description: "The complete API platform for legal tech developers. 195+ AI models, 800+ legal skills, encrypted vaults, OCR, transcription, and durable workflows.",
  icons: [{
    theme:"light",
    src: "https://docs.case.dev/mintlify-assets/_mintlify/favicons/casemark/DWtCT9lACuTaN9uc/_generated/favicon/android-chrome-192x192.png"
  }, {
    theme:"dark",
    src: "https://case.dev/favicon.svg"
  }],
  urls: {
    homepage: "https://case.dev",
    docs: "https://docs.case.dev",
    pricing: "https://case.dev/#pricing",
    privacyPolicy: "https://case.dev/privacy",
    termsOfService: "https://case.dev/terms"
  },
  providerCountry: "HK",
  category: "search_data",
  inferenceRegions: ["World"]

};

