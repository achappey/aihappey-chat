import type { Provider } from "aihappey-types";

export const nearai: Provider = {
  name: "NEARAI",
  description: "Turn Sensitive Data into Safe Intelligence. Unlock inference for sensitive data with privacy you can verify and models you control.",
  icons: [
    {
      src: "https://s3.coinmarketcap.com/static-gravity/image/ef3ad80e423a4449ab8e961b0d1edea4.png"
    }
  ],
  urls: {
    homepage: "https://near.ai",
    docs: "https://cloud-api.near.ai/docs",
    console: "https://cloud.near.ai",
    termsOfService: "https://near.ai/near-ai-cloud-terms-of-service",
    privacyPolicy: "https://near.ai/privacy-policy"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

