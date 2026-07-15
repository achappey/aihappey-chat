import type { Provider } from "aihappey-types";

export const darkbloom: Provider = {
  name: "Darkbloom",
  icons: [{ src: "https://openrouter.ai/images/icons/Darkbloom.png" }],
  description:
    "Darkbloom routes encrypted AI inference to hardware-verified Apple Silicon providers. Get comparable model performance at about 50% lower cost than typical API providers, with operator-blind privacy.",
  urls: {
    homepage: "https://www.darkbloom.dev",
    console: "https://console.darkbloom.dev",
    pricing: "https://www.darkbloom.dev/#pricing",
    privacyPolicy: "https://www.darkbloom.dev/privacy.html",
    termsOfService: "https://www.darkbloom.dev/terms.html"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

