import { DataUIPart } from "aihappey-ai";
import { DataCard } from "aihappey-components";
import React from "react";

/**
 * Renders a list of all tool invocation activities in the current conversation as cards.
 */
export const DataActivity: React.FC<{
  dataCards?: any[];
}> = (props: { dataCards?: DataUIPart<any>[] }) => {
  const { dataCards } = props;
  var values = dataCards?.reverse();
  return (
    <div
      style={{ padding: 8, display: "flex", flexDirection: "column", gap: 12 }}
    >
      {values?.map((inv, i) => (
        <DataCard
          key={(inv.type + i) + "-inv"}
          block={inv}
        />
      ))}
    </div>
  );
};
