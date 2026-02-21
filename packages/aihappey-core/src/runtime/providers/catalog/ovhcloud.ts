import type { Provider } from "aihappey-types";

export const ovhcloud: Provider = {
  name: "OVHcloud",
  description: "OVHcloud offers more than 80 open and reversible services with the best price-performance ratio, including domain names, VPS, dedicated servers, IaaS and PaaS cloud.",
  icons: [
    {
      src: "https://pbs.twimg.com/profile_images/1178940876078407680/p0SH0xKH_400x400.jpg"
    }
  ],
  urls: {
    homepage: "https://www.ovhcloud.com",
    docs: "https://docs.ovh.com",
    privacyPolicy: "https://www.ovhcloud.com/en/personal-data-protection",
    termsOfService: "https://www.ovhcloud.com/en/terms-and-conditions"
  },
  providerCountry: "FR",
  inferenceRegions: ["Americas", "Europe", "Asia"]

};

