import type { Provider } from "aihappey-types";

export const kilo: Provider = {
  name: "Kilo",
  description:
    "Build, ship, and iterate faster with the most popular open source coding agent.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMLlNkfiVjeIdE8Sw7_GmVbxfOaqo-GnRX3w&s"
    }
  ],
  urls: {
    homepage: "https://kilo.ai",
    docs: "https://kilo.ai/docs",
    console: "https://app.kilo.ai",
    termsOfService: "https://kilo.ai/terms",
    privacyPolicy: "https://kilo.ai/privacy"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};