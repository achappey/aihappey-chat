import type { Provider } from "aihappey-types";

export const nousresearch: Provider = {
  name: "NousResearch",
  description:
    "Nous Research is a leader in the American open source AI movement, training world-class open source language models.",
  icons: [
    {
      src: "https://nousresearch.com/wp-content/uploads/2024/03/Noushirt-2.webp"
    }
  ],
  urls: {
    homepage: "https://nousresearch.com",
    docs: "https://portal.nousresearch.com/api-docs",
    termsOfService: "https://portal.nousresearch.com/terms",
    privacyPolicy: "https://portal.nousresearch.com/privacy",
    console: "https://portal.nousresearch.com"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};