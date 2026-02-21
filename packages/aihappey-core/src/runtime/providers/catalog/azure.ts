import type { Provider } from "aihappey-types";

export const azure: Provider = {
  name: "Azure",
  description:
    "Invent with purpose, realize cost savings, and make your organization more efficient with Microsoft Azure’s open and flexible cloud computing platform.",
  icons: [
    {
      src: "https://brandlogos.net/wp-content/uploads/2022/07/microsoft_azure-logo_brandlogos.net_mlyt6-512x512.png",
    },
  ],
  urls: {
    homepage: "https://azure.microsoft.com",
    docs: "https://learn.microsoft.com/azure",
    privacyPolicy: "https://privacy.microsoft.com",
    console: "https://portal.azure.com",
    termsOfService: "https://www.microsoft.com/licensing/docs"
  },
  providerCountry: "US",
  inferenceRegions: ["Europe", "Americas", "Asia", "Africa", "Oceania"]

};

