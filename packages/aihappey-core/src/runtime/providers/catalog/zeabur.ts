import type { Provider } from "aihappey-types";

export const zeabur: Provider = {
  name: "Zeabur",
  description: "Your AI DevOps Engineer — Deploy anything to any cloud platform through the most familiar way: conversing with AI.",
  icons: [{
    src: "https://zeabur.com/logo-dark.svg",
    theme: "dark"
  }, {
    src: "https://zeabur.com/logo.svg",
    theme: "light"
  }],
  urls: {
    homepage: "https://zeabur.com",
    docs: "https://zeabur.com/docs",
    pricing: "https://zeabur.com/pricing",
    privacyPolicy: "https://zeabur.com/docs/legal/privacy",
    termsOfService: "https://zeabur.com/docs/legal/terms"
  },
  providerCountry: "SG",
  inferenceRegions: ["Asia", "Americas"]

};

