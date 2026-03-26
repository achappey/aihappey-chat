import type { Provider } from "aihappey-types";

export const magisterium: Provider = {
  name: "Magisterium",
  description: "World's #1 answer engine for the Catholic Church. Get cited answers from the magisterium, Bible, and Fathers of the Church.",
  icons: [{
    src: "https://www.magisterium.com/apple-icon.png?apple-icon.2847d4d4.png"
  }],
  urls: {
    homepage: "https://www.magisterium.com",
    docs: "https://www.magisterium.com/en/developers",
    pricing: "https://www.magisterium.com/developers/pricing",
    privacyPolicy: "https://www.magisterium.com/privacy-policy",
    termsOfService: "https://www.magisterium.com/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

