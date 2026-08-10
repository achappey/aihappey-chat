import { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const formatCentsAsUsd = (value: unknown) => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return "";

  try {
    const cents = BigInt(value);
    return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
  } catch {
    return "";
  }
};

const parseUsdAsCents = (value: string) => {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return undefined;

  try {
    const cents = BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0") || "0");
    return cents > 0n ? cents.toString() : undefined;
  } catch {
    return undefined;
  }
};

const withoutBudget = (config: any) => {
  const { budget: _budget, ...nextConfig } = config ?? {};
  return nextConfig;
};

export const AnthropicSessionCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const configuredAmount = config?.budget?.max_list_cost?.amount;
  const [sessionBudgetOn, setSessionBudgetOn] = useState(
    config?.budget !== undefined && config?.budget !== null
  );
  const [usdAmount, setUsdAmount] = useState(() => formatCentsAsUsd(configuredAmount));

  const updateUsdAmount = (value: string) => {
    setUsdAmount(value);
    const amount = parseUsdAsCents(value);

    if (!amount) {
      updateConfig(withoutBudget(config));
      return;
    }

    updateConfig({
      ...withoutBudget(config),
      budget: {
        type: "limit",
        max_list_cost: {
          amount,
          currency: "USD",
        },
      },
    });
  };

  return (
    <theme.Card
      size="small"
      title={t("providers:anthropic.session.title")}
      headerActions={
        <theme.Switch
          id="anthropic-session-budget"
          checked={sessionBudgetOn}
          onChange={(checked: boolean) => {
            setSessionBudgetOn(checked);

            if (!checked) {
              setUsdAmount("");
              updateConfig(withoutBudget(config));
            }
          }}
        />
      }
    >
      <theme.Input
        type="number"
        min={0.01}
        step={0.01}
        required={sessionBudgetOn}
        disabled={!sessionBudgetOn}
        label={t("providers:anthropic.session.maxListCostUsd")}
        placeholder="0.00 USD"
        value={usdAmount}
        onChange={(e: any) => updateUsdAmount(e.target.value)}
      />
    </theme.Card>
  );
};
