import type { Provider } from "aihappey-types";

export const bergetai: Provider = {
  name: "BergetAI",
  description: "EU-compliant inference service and AI infrastructure built by developers for developers.",
  icons: [
    {
      src: "https://media.licdn.com/dms/image/v2/D4D0BAQHQGuTgU7ix9w/company-logo_200_200/B4DZWbcxfDGkAI-/0/1742069766482/bergetai_logo?e=2147483647&v=beta&t=EkSpekwlwpXxB9L4u92NEy8s1jqTJaxMnEaSTr1tfZA",
    }
  ],
  urls: {
    homepage: "https://berget.ai",
    privacyPolicy: "https://berget.ai/privacy",
    termsOfService: "https://berget.ai/terms"
  },
  providerCountry: "SE",
  inferenceRegions: ["Europe"]

};

