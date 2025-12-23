import { ThrottlingField } from "../fields/ThrottlingField";
import { useTheme } from "../theme/ThemeContext";

type ChatSettings = {
  throttle: number;
};

type ChatSettingsFormProps = {
  value: ChatSettings;
  onChange: (settings: ChatSettings) => void;
  translations?: any;
  formTitle?: string;
};

export const ChatSettingsForm = ({
  value,
  onChange,
  translations,
  formTitle,
}: ChatSettingsFormProps) => {
  const { Card } = useTheme();

  return (
    <Card size="small" title={formTitle}>
      <div>
        <ThrottlingField
          value={value.throttle}
          translations={translations}
          onChange={(throttle) =>
            onChange({
              ...value,
              throttle,
            })
          }
        />
      </div>
    </Card>
  );
};
