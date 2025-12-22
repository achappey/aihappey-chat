import { useTheme } from "../theme/ThemeContext";

type FieldProps = {
  fieldName: string;
  field: any;
  value: any;
  onChange: (val: any) => void;
  required: boolean;
};

export const ElicitationField = ({
  fieldName,
  field,
  value,
  onChange,
  required,
}: FieldProps) => {
  const { Input, Select, Switch, TextArea } = useTheme();

  const label = field.title || fieldName;
  if (field.type === "boolean") {
    return (
      <div style={{ marginBottom: 12 }}>
        <Switch
          id={fieldName}
          label={label}
          hint={field.description}
          checked={!!value}
          onChange={onChange}
        />
      </div>
    );
  }

  if (field.type == "string" && field.oneOf?.length > 0) {
    return (
      <div style={{ marginBottom: 12 }}>
        <Select
          value={field.oneOf.find((a: any) => a.const == value)?.title ?? value}
          hint={field.description}
          required={required}
          label={label}
          onChange={onChange}
          aria-label={label}
        >
          {field.oneOf.map((opt: any, i: number) => (
            <option key={i} value={opt.const}>
              {opt.title}
            </option>
          ))}
        </Select>
      </div>
    );
  }

  const type =
    field.type === "number" || field.type === "integer"
      ? "number"
      : field.format === "email"
        ? "email"
        : field.format === "uri"
          ? "url"
          : field.format === "date"
            ? "date"
            : field.format === "date-time"
              ? "datetime-local"
              : "text";

  const input =
    type == "text" ? (
      <TextArea
        hint={field.description}
        value={value}
        rows={3}
        required={required}
        label={label}
        onChange={onChange}
      />
    ) : (
      <Input
        type={type}
        hint={field.description}
        value={value}
        label={label}
        onChange={(e) =>
          onChange(type === "number" ? Number(e.target.value)
            : e.target.value)
        }
        min={field.minimum}
        max={field.maximum}
        step={field.maximum > 1 ? 1 : 0.1}
        minLength={field.minLength}
        maxLength={field.maxLength}
        required={required}
      />
    );

  return (
    <div style={{ marginBottom: 12 }}>
      {input}
    </div>
  );
};
