import type { Provider } from "aihappey-types";

export const telnyx: Provider = {
  name: "Telnyx",
  description: "Your AI agents deserve carrier-grade voice. Telnyx delivers global reach, low latency, and crystal-clear calls.",
  icons: [
    {
      src: "https://avatars.githubusercontent.com/u/10522416?s=200&v=4"
    },
  ],
  urls: {
    homepage: "https://telnyx.com",
    docs: "https://developers.telnyx.com",
    privacyPolicy: "https://telnyx.com/privacy-policy",
    termsOfService: "https://telnyx.com/terms-and-conditions-of-service",
    console: "https://portal.telnyx.com"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

