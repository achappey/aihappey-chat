import type { Provider } from "aihappey-types";

export const jules: Provider = {
  name: "Jules",
  description: "Jules is an Autonomous agent that gets out of your way. It lets you focus on the coding you want to do, meanwhile picking up all the other random tasks that you rather not do.",
  icons: [{
    src: "https://jules.google/favicon.svg"
  }],
  urls: {
    homepage: "https://jules.google",
    docs: "https://developers.google.com/jules/api",
    privacyPolicy: "https://policies.google.com/privacy",
    termsOfService: "https://policies.google.com/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

