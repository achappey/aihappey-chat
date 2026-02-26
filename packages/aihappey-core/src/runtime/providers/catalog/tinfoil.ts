import type { Provider } from "aihappey-types";

export const tinfoil: Provider = {
  name: "Tinfoil",
  description:
    "AI that keeps your data private at all times. Fast, powerful, and verifiable, thanks to secure hardware enclaves.",
  icons: [
    {
      src: "https://mintcdn.com/tinfoil/0ViQTbwRCR_TUpT7/logo/dark.png?fit=max&auto=format&n=0ViQTbwRCR_TUpT7&q=85&s=4286f60f42762cf23a4354c8e52f888b",
      theme: "dark",
    },
    {
      src: "https://tinfoil.sh/icon.png",
      theme: "light",
    },
  ],
  urls: {
    homepage: "https://tinfoil.sh",
    docs: "https://docs.tinfoil.sh",
    console: "https://dash.tinfoil.sh",
    privacyPolicy: "https://tinfoil.sh/privacy",
    termsOfService: "https://tinfoil.sh/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

