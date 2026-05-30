import type { Provider } from "aihappey-types";

export const picsart: Provider = {
  name: "Picsart",
  description: "Allows you to edit photos, remove backgrounds and create new ones faster and easier. The only AI-powered creative companion you'll ever need to grow your brand.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzCWMPhz9hnGN1JLsTJedaLSUhG67uzGZlOg&s"
    }
  ],
  urls: {
    homepage: "https://picsart.com",
    console: "https://console.picsart.io",
    docs: "https://docs.picsart.io",
    pricing: "https://picsart.com/pricing",
    privacyPolicy: "https://picsart.com/privacy-policy",
    termsOfService: "https://picsart.com/terms-of-use"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

