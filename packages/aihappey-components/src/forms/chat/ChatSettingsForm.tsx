import { memo, useCallback } from "react";
import { ThrottlingField } from "../../fields/ThrottlingField";
import { useTheme } from "../../theme/ThemeContext";

type ChatSettings = {
  throttle: number;
};

type ChatSettingsFormProps = {
  value: ChatSettings;
  onChange: (settings: ChatSettings) => void;
  
  formTitle?: string;
};

export const ChatSettingsForm = memo(({
  value,
  onChange,
  formTitle,
}: ChatSettingsFormProps) => {
  const { Card } = useTheme();

  const handleThrottleChange = useCallback(
    (throttle: number) =>
      onChange({
        ...value,
        throttle,
      }),
    [onChange, value]
  );

  return (
    <Card size="small" title={formTitle}>
      <div>
        <ThrottlingField
          value={value.throttle}
          onChange={handleThrottleChange}
        />
      </div>
    </Card>
  );
});
