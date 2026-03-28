import type { Provider } from "aihappey-types";

export const packetai: Provider = {
  name: "PacketAI",
  description:
    "Rent NVIDIA B200, H200, and RTX 6000 96GB GPUs on-demand. Deploy in under 5 minutes with SSH access, no contracts, and up to 75% savings vs AWS. European GPU cloud built by hosted.ai.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://packet.ai&size=128"
    }
  ],
  urls: {
    homepage: "https://packet.ai",
    docs: "https://packet.ai/docs",
    pricing: "https://packet.ai/#pricing",
    privacyPolicy: "https://packet.ai/privacy",
    termsOfService: "https://packet.ai/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

