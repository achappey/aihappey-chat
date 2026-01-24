import type { Provider } from "aihappey-types";

export const kernelmemory: Provider = {
  name: "KernelMemory",
  experimental: true,
  description:
    "Kernel Memory is an experimental research project exploring long-term memory for AI systems, including document ingestion, indexing, semantic search, and retrieval. It is a learning-focused prototype with no stability guarantees and is not intended for production use.",
  icons: [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/960px-Microsoft_logo.svg.png",
    },
  ],
  url: "https://github.com/microsoft/kernel-memory",
};

