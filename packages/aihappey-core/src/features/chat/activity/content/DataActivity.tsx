import { DataCard } from "aihappey-components";
import React from "react";

/**
 * Renders a list of all tool invocation activities in the current conversation as cards.
 */
export const DataActivity: React.FC<{
  dataCards?: any[];
}> = (props: { dataCards?: any[] }) => {
  const { dataCards } = props;
  var values = dataCards?.reverse();
  return (
    <div
      style={{ padding: 8, display: "flex", flexDirection: "column", gap: 12 }}
    >
      {values?.map((inv, i) => (
        <DataCard
          key={(inv.type + i) + "-inv"}
          type={inv.type}
          data={inv.data}
        />
      ))}
    </div>
  );
};
