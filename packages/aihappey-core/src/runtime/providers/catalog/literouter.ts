import type { Provider } from "aihappey-types";

export const literouter: Provider = {
  name: "LiteRouter",
  description:
    "LiteRouter is a unified AI API aggregator providing access to GPT-4, Claude, and 100+ AI models through a single gateway. Get started free with instant integration and scalable infrastructure.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://literouter.com&size=128",
    },
  ],
  urls: {
    homepage: "https://literouter.com",
    docs: "https://literouter.com/api_docs",
    termsOfService: "https://literouter.com/terms",
    privacyPolicy: "https://literouter.com/privacy",
    console: "https://literouter.com/api_dashboard.php"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]
};

