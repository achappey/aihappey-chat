import type { Provider } from "aihappey-types";

export const reve: Provider = {
  name: "Reve",
  description: "Reve: Reimagine reality. Create, edit, and remix images. Combine natural-language edits with a drag-and-drop image editor.",
  icons: [
    {
      src: "https://media.licdn.com/dms/image/v2/D4E0BAQHJ0FZruc6k0Q/company-logo_200_200/B4EZkwq5SrKcAI-/0/1757458175427/reve_art_logo?e=2147483647&v=beta&t=Zj5RyWx5VbQUwj0QZ3Nd3PC686YJrs-6O7FzK1hB2jQ",
      theme: "dark",
    },
    {
      src: "https://avatars.githubusercontent.com/u/165961799?s=200&v=4",
      theme: "light",
    },
  ],
  urls: {
    homepage: "https://app.reve.com",
    privacyPolicy: "https://reve.com/privacy",
    termsOfService: "https://reve.com/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

