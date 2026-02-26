import type { Provider } from "aihappey-types";

export const yourvoic: Provider = {
  name: "YourVoic",
  description: "Enterprise Text-to-Speech API with sub-second latency. Power voice agents, IVR systems, and audio platforms with remarkably human voices.",
  icons: [
    {
      src: "https://media.licdn.com/dms/image/v2/D4D0BAQGrckw1tVN4Hg/company-logo_200_200/B4DZd5Ux7ZH4AQ-/0/1750087180489/yourvoic_logo?e=2147483647&v=beta&t=8WYz4yy1kJSpUWbkpkYqHN8JU1NKmb0fn5u0KRm6SVE"
    }
  ],
  urls: {
    homepage: "https://yourvoic.com",
    docs: "https://yourvoic.com/api/docs",
    privacyPolicy: "https://yourvoic.com/privacy"
  },
  providerCountry: "IN",
  inferenceRegions: ["World"]
};

