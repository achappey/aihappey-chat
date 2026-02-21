import type { Provider } from "aihappey-types";

export const arklabs: Provider = {
  name: "ARKLabs",
  description:
    "Smart AI Infrastructure. No Headaches. Affordable, flexible cloud + on-prem options for teams who want control without chaos.",
  icons: [
    {
      src: "https://pbs.twimg.com/profile_images/1953784719708934144/GJ-a2b5O_400x400.jpg",
    },
  ],
  urls: {
    homepage: "https://ark-labs.cloud",
    docs: "https://ark-labs.cloud/documentation/",
    privacyPolicy: "https://ark-labs.cloud/privacy",
    termsOfService: "https://ark-labs.cloud/terms"
  },
  providerCountry: "PL",
  inferenceRegions: ["World"]
};

