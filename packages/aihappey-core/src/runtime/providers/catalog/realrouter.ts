import type { Provider } from "aihappey-types";

export const realrouter: Provider = {
  name: "RealRouter",
  description: "Subscription access to OpenAI-compatible API keys and a mobile chat app, powered by one shared monthly Realrouter credit balance.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZMdnLHu6wdv1CSSGYsiNozXrEPHjvRSaJl8fpOzxAS407nCcgrEFy6KeP&s=10"
  }],
  urls: {
    homepage: "https://realrouter.org",
    docs: "https://realrouter.org/docs",
    pricing: "https://realrouter.org/pricing",
    privacyPolicy: "https://realrouter.org/privacy",
    termsOfService: "https://realrouter.org/terms"
  },
  providerCountry: "CA",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

