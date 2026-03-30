import type { Provider } from "aihappey-types";

export const paul: Provider = {
  name: "Paul",
  description: "Paul is an AI designed for your reality — studies, employment, business, tech. Available in French, adapted to the Cameroonian context.",
  icons: [{
    src: "https://chat.fatherpaulai.com/static/apple-touch-icon.png?v=pp24"
  }],
  urls: {
    homepage: "https://www.fatherpaulai.com",
    docs: "https://www.fatherpaulai.com/guide-api.html",
    pricing:"https://www.fatherpaulai.com/#pricing",
    privacyPolicy: "https://www.fatherpaulai.com/guide-api.html#",
    termsOfService: "https://www.fatherpaulai.com/guide-api.html#"
  },
  providerCountry: "CM",
  inferenceRegions: ["World"]

};

