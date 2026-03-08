import type { Provider } from "aihappey-types";

export const cohere: Provider = {
  name: "Cohere",
  description:
    "Cohere builds powerful models and AI solutions enabling enterprises to automate processes, empower employees, and turn fragmented data into actionable insights.",
  icons: [
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/cohere-color.png",
      theme: "dark",
    },
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/cohere-color.png",
      theme: "light",
    },
  ],
  urls: {
    homepage: "https://cohere.com",
    docs: "https://docs.cohere.com",
    pricing: "https://cohere.com/pricing",
    privacyPolicy: "https://cohere.com/privacy",
    termsOfService: "https://cohere.com/terms-of-use"
  },
  providerCountry: "CA",
  inferenceRegions: ["World"]

};

