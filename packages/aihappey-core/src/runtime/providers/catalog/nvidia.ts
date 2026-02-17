import type { Provider } from "aihappey-types";

export const nvidia: Provider = {
  name: "NVIDIA",
  experimental: true,
  description:
    "NVIDIA invents GPUs and drives advances in AI, high-performance computing, gaming, and autonomous systems.",
  icons: [
    {
      src: "https://www.citypng.com/public/uploads/preview/hd-nvidia-eye-logo-icon-png-701751694965655t2lbe7yugk.png",
    },
  ],
  url: "https://www.nvidia.com",
  providerCountry: "US",
  inferenceRegions: ["World"]
};

