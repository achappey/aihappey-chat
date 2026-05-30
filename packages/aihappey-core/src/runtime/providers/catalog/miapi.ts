import type { Provider } from "aihappey-types";

export const miapi: Provider = {
  name: "MIAPI",
  description: "Get AI-powered answers grounded in real-time web search. Drop-in OpenAI compatible. Inline citations, knowledge mode, streaming. As low as $0.0025/query.",
  icons: [{
    src: "https://miapi.uk/favicon.svg"
  }],
  urls: {
    homepage: "https://miapi.uk",
    docs: "https://miapi.uk/#docs",
    pricing: "https://miapi.uk/#pricing",
    privacyPolicy: "https://miapi.uk/privacy.html",
    termsOfService: "https://miapi.uk/terms.html"
  },
  providerCountry: "GB",
  category: "search_data",
  inferenceRegions: ["World"]

};

