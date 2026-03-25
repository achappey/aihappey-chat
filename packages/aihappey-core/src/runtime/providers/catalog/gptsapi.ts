import type { Provider } from "aihappey-types";

export const gptsapi: Provider = {
  name: "GPTsAPI",
  description: "OpenAI API，无需账号，即买即用",
  icons: [{
    src: "https://gptsapi.net/favicon.ico"
  }],
  urls: {
    homepage: "https://gptsapi.net",
    privacyPolicy: "https://gptsapi.net/privacy",
    termsOfService: "https://gptsapi.net/terms"
  },
  providerCountry: "HK",
  inferenceRegions: ["World"]

};

