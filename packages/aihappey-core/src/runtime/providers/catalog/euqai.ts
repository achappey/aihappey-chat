import type { Provider } from "aihappey-types";

export const euqai: Provider = {
  name: "Euqai",
  description:
    "Stop wasting your AI budget. Switch to Euqai Fusion, the GDPR-compliant, intelligent API that uses the right model for the right task to dramatically cut costs.",
  icons: [{ src: "https://euqai.eu/home/images/euqai-q-logo.png" }],
  urls: {
    homepage: "https://euqai.eu",
    docs: "https://euqai.eu/home/developers.html",
    pricing: "https://euqai.eu/home/developers.html",
    privacyPolicy: "https://euqai.eu/static/privacy",
    termsOfService: "https://euqai.eu/static/terms"
  },
  providerCountry: "NL",
  inferenceRegions: ["World"]
};

