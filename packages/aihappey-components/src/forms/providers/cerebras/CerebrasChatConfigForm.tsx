import { CerebrasOtherCard } from "./cards/CerebrasOtherCard";
import { CerebrasReasoningCard } from "./cards/CerebrasReasoningCard";

export const CerebrasChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (config: any) => void;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    <CerebrasReasoningCard config={config} updateConfig={updateConfig} />
    <CerebrasOtherCard config={config} updateConfig={updateConfig} />
  </div>
);
