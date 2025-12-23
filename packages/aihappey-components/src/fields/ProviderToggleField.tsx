import { useTheme } from "../theme/ThemeContext";

export type ProviderToggleFieldProps = {
  provider: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export const ProviderToggleField = ({
  provider,
  checked,
  onChange,
  label
}: ProviderToggleFieldProps) => {
  const { Switch } = useTheme();

  return (
    <Switch
      id={`provider-${provider}`}
      label={label ?? provider}
      size={"small"}
      checked={checked}
      onChange={() => onChange(!checked)}
    />
  );
};
