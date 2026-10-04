import type { Provider } from "aihappey-types";

export const copilot: Provider = {
  name: "Copilot",
  description: "Get an AI assistant for work with Microsoft 365 Copilot. See how an enterprise AI solution can support your business and learn more about Copilot plans and pricing.",
  icons: [{
    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Microsoft-copilot-2026-seeklogo.svg/1280px-Microsoft-copilot-2026-seeklogo.svg.png"
  }],
  urls: {
    homepage: "https://www.microsoft.com/en-us/microsoft-365-copilot",
    docs: "https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/chat/overview",
    pricing: "https://www.microsoft.com/en-us/microsoft-365-copilot/pricing",
    privacyPolicy: "https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy",
    termsOfService: "https://learn.microsoft.com/en-us/legal/m365-copilot-apis/terms-of-use"
  },
  providerCountry: "US",
  category: "app_tools",
  inferenceRegions: ["Europe", "Americas", "Asia", "Africa", "Oceania"]

};

