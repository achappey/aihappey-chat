import type { Provider } from "aihappey-types";

export const sovrgpt: Provider = {
  name: "SovrGPT",
  description: "Datenschutz-konforme KI-Plattform für europäische Unternehmen. Open-Source-Modelle, EU-Hosting, volle Datensouveränität.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://sovrgpt.com&size=128"
  }],
  urls: {
    homepage: "https://sovrgpt.com",
    docs: "https://sovrgpt.com/docs",
    privacyPolicy: "https://sovrgpt.com/datenschutz",
    termsOfService: "https://sovrgpt.com/impressum"
  },
  providerCountry: "DE",
  inferenceRegions: ["World"]

};

