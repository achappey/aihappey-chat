import type { Provider } from "aihappey-types";

export const nebius: Provider = {
  name: "Nebius",
  description:
    "Discover the most efficient way to build, tune and run your AI models and applications on top-notch NVIDIA® GPUs.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKRoO9XCNhc_7_DVpQm8BsTL_oVF6q57IZPA&s",
    }
  ],
  urls: {
    homepage: "https://nebius.com",
    docs: "https://nebius.com/docs",
    pricing: "https://nebius.com/token-factory/prices",
    console: "https://tokenfactory.nebius.com",
    privacyPolicy: "https://docs.nebius.com/legal/privacy",
    termsOfService: "https://docs.nebius.com/legal/terms-of-use"
  },
  providerCountry: "NL",
  category: "gateway_router",
  inferenceRegions: ["World"]
};

