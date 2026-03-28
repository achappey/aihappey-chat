import type { Provider } from "aihappey-types";

export const wiserouter: Provider = {
  name: "WiseRouter",
  description: "One API that automatically picks and runs the best open-source AI model for every prompt.",
  icons: [{
    src: "https://wiserouter.ai/favicon.ico"
  }],
  urls: {
    homepage: "https://wiserouter.ai/",
    docs: "https://wiserouter.ai/docs",
    pricing: "https://wiserouter.ai/#pricing",
    privacyPolicy: "https://wiserouter.ai/privacy",
    termsOfService: "https://wiserouter.ai/terms"
  },
  providerCountry: "AU",
  inferenceRegions: ["World"]

};

