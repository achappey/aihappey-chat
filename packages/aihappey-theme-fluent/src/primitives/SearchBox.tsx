import { SearchBox as FSearchBox } from "@fluentui/react-components";
import { useDarkMode } from "usehooks-ts";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
}

export const SearchBox = ({
  value,
  onChange,
  placeholder,
  disabled,
  style,
  className,
  autoFocus,
}: SearchBoxProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <FSearchBox
      value={value}
      style={{
        width: "100%",
        backgroundColor: isDarkMode ? "#0a0a0a" : undefined,
        ...style,
      }}
      onChange={(_, data) => onChange(data.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      autoFocus={autoFocus}
    />
  );
};
