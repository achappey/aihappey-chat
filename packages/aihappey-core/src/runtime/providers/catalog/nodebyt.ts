import type { Provider } from "aihappey-types";

export const nodebyt: Provider = {
  name: "Nodebyt",
  description: "Better prices, higher availability, no subscriptions. Supports Claude, Llama, and more.",
  icons: [{
    src: "https://www.nodebyt.com/favicon.svg"
  }],
  urls: {
    homepage: "https://www.nodebyt.com",
    docs: "https://www.nodebyt.com/docs",
    console: "https://www.nodebyt.com/dashboard",
    pricing: "https://www.nodebyt.com/pricing"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

