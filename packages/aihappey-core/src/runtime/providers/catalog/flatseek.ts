import type { Provider } from "aihappey-types";

export const flatseek: Provider = {
  name: "Flatseek",
  description:
    "Disk-first trigram search engine. Index billions of rows from CSV. Query via dashboard or CLI. A fraction of the cost of Elasticsearch.",
  urls: {
    homepage: "https://flatseek.io",
    docs: "https://flatseek.io/docs"
  },
  providerCountry: "ID",
  category: "model_provider",
  inferenceRegions: ["World"]

};

