import type { Provider } from "aihappey-types";

export const selinaai: Provider = {
  name: "SelinaAI",
  description: "Selina AI — SelinaFOLD Protocol. Stop paying for the same thinking twice.",
  icons: [{
    src: "https://selina.ai/favicon.svg"
  }],
  urls: {
    homepage: "https://selina.ai",
    docs: "https://selina.ai/docs",
    privacyPolicy: "https://selinalabs.io/privpol",
    termsOfService: "https://selinalabs.io/t-and-c"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

