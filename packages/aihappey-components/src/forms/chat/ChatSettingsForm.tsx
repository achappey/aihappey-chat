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

export const ChatSettingsForm = ({
  value,
  onChange,
  formTitle,
}: ChatSettingsFormProps) => {
  const { Card } = useTheme();

  return (
    <Card size="small" title={formTitle}>
      <div>
        <ThrottlingField
          value={value.throttle}
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
