import { useTheme } from "../../theme/ThemeContext";

export type PromptArgument = {
  name: string;
  required?: boolean;
  description?: string;
};

export type PromptArgumentsFormProps = {
  arguments: PromptArgument[];
  values: Record<string, string>;
  completions: Record<string, string[]>;
  loadingCompletions?: boolean;
  pending?: boolean;
  missingRequired?: boolean;
  error?: string | null;
  onChange: (name: string, value: string) => void;
  onFilter?: (name: string, value: string) => Promise<void> | void;
  /** Used to preserve enter-to-submit behavior. */
  onSubmit?: () => void;
};

export const PromptArgumentsForm = ({
  arguments: args,
  values,
  completions,
  loadingCompletions,
  pending,
  missingRequired,
  error,
  onChange,
  onFilter,
  onSubmit,
}: PromptArgumentsFormProps) => {
  const { Input, Spinner, Alert, Select } = useTheme();

  return (
    <div style={{ minWidth: 320, maxHeight: 400, overflowY: "auto" }}>
      {loadingCompletions ? (
        <Spinner />
      ) : (
        (args ?? []).map((arg) => (
          <div key={arg.name} style={{ marginBottom: 12, marginRight: 12 }}>
            {/* Keep per-field <form> to match existing enter-to-submit behavior */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pending && !missingRequired) onSubmit?.();
              }}
            >
              {completions[arg.name] ? (
                <Select
                  value={values[arg.name] ?? ""}
                  freeform
                  label={arg.name}
                  required={arg.required}
                  hint={arg.description}
                  onFilter={async (z: string) => {
                    onChange(arg.name, z);
                    await onFilter?.(arg.name, z);
                  }}
                  onChange={(v: string) => onChange(arg.name, v)}
                  disabled={pending}
                >
                  {completions[arg.name].map((opt: string, i: number) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={values[arg.name] ?? ""}
                  label={arg.name}
                  required={arg.required}
                  hint={arg.description}
                  onChange={(e: any) => onChange(arg.name, e.target.value)}
                  disabled={pending}
                />
              )}
            </form>
          </div>
        ))
      )}

      {error && (
        <div style={{ marginTop: 4 }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}
    </div>
  );
};

