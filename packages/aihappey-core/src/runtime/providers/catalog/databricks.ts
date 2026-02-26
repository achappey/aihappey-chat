import type { Provider } from "aihappey-types";

export const databricks: Provider = {
  name: "Databricks",
  description: "Databricks offers a unified platform for data, analytics and AI. Build better AI with a data-centric approach. Simplify ETL, data warehousing, governance and AI on the Data Intelligence Platform.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS36Vt4wSXF8AZGnryASm-iL1f71ucL1f9pjg&s"
    }
  ],
  urls: {
    homepage: "https://www.databricks.com",
    docs: "https://www.databricks.com/databricks-documentation",
    termsOfService: "https://www.databricks.com/legal/terms-of-use",
    privacyPolicy: "https://www.databricks.com/legal/privacynotice"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

