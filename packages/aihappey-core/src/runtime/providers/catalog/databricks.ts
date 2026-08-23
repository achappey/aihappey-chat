import type { Provider } from "aihappey-types";

export const databricks: Provider = {
  name: "Databricks",
  description: "Databricks offers a unified platform for data, analytics and AI. Build better AI with a data-centric approach. Simplify ETL, data warehousing, governance and AI on the Data Intelligence Platform.",
  urls: {
    homepage: "https://www.databricks.com",
    pricing: "https://www.databricks.com/product/pricing/foundation-model-serving",
    docs: "https://www.databricks.com/databricks-documentation",
    termsOfService: "https://www.databricks.com/legal/terms-of-use",
    privacyPolicy: "https://www.databricks.com/legal/privacynotice"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["Europe", "Americas", "Asia", "Oceania"]
};

