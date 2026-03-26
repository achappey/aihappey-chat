import type { Provider } from "aihappey-types";

export const nouswise: Provider = {
  name: "Nouswise",
  description: "Nouswise is an AI-powered research agent that delivers trustworthy, precise responses drawn from a carefully curated library, perfect for high regulated industries.",
  icons: [{
    src: "https://framerusercontent.com/images/dNw2cPLdln6McWIrHrbElAkbts.png",
    theme: "dark"
  }, {
    src: "https://framerusercontent.com/images/BaImlpbrLw8FnDw1alp0IJ4smI.png",
    theme: "light"
  }],
  urls: {
    homepage: "https://nouswise.com",
    docs: "https://docs.nouswise.com",
    pricing: "https://nouswise.com/pricing",
    privacyPolicy: "https://nouswise.com/p/legal/privacy",
    termsOfService: "https://nouswise.com/p/legal/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

