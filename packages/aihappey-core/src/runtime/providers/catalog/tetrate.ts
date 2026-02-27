import type { Provider } from "aihappey-types";

export const tetrate: Provider = {
  name: "Tetrate",
  description:
    "Tetrate provides trusted connectivity and control for AI. Empower developers while safeguarding the business. Built atop the proven Envoy proxy & Envoy AI Gateway.",
  icons: [
    {
      src: "https://media.licdn.com/dms/image/v2/D560BAQEJ_6CK6j16Og/company-logo_200_200/B56Zb5QAiyHwAM-/0/1747938445812/tetrate_logo?e=2147483647&v=beta&t=O16xsiiYafA6MGDeKmv29-vEOSb1GxQ5yctOjUDi93k",
    },
  ],
  urls: {
    homepage: "https://tetrate.io",
    docs: "https://docs.tetrate.io",
    console: "https://router.tetrate.ai",
    privacyPolicy: "https://tetrate.io/privacy",
    termsOfService: "https://tetrate.io/eula"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

