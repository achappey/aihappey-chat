import { useTheme } from "aihappey-components";
import { usePromptArguments } from "./usePromptArguments";
import { PromptWithSource } from "./PromptSelectButton";
import { CancelButton } from "../../ui/buttons/CancelButton";

type Props = {
  prompt: PromptWithSource;
  onHide: () => void;
  onPromptExecute?: any;
};

export const PromptArgumentsModal = ({
  prompt,
  onHide,
  onPromptExecute,
}: Props) => {
  const { Modal, Button, Input, Spinner, Alert, Select } = useTheme();

  const {
    values,
    handleChange,
    completions,
    loadingCompletions,
    error,
    pending,
    missingRequired,
    handleOk,
    onFilter,
  } = usePromptArguments({ prompt, onPromptExecute });

  return (
    <Modal
      show={true}
      onHide={onHide}
      actions={
        <>
          <CancelButton disabled={pending} onClick={onHide} />
          <Button
            type="button"
            onClick={() => handleOk(onHide)}
            disabled={pending || missingRequired}
          >
            {pending ? <Spinner size="sm" /> : "OK"}
          </Button>
        </>
      }
      title={prompt.title ?? prompt.name}>
      <div style={{ minWidth: 320, maxHeight: 400, overflowY: "auto" }}>
        {loadingCompletions ? (
          <Spinner />
        ) : (
          (prompt.arguments ?? []).map((arg) => (
            <div key={arg.name} style={{ marginBottom: 12, marginRight: 12 }}>
              <form onSubmit={() => !pending && !missingRequired && handleOk(onHide)}>
                {completions[arg.name] ? (
                  <Select
                    value={values[arg.name] ?? ""}
                    freeform
                    label={arg.name}
                    required={arg.required}
                    hint={arg.description}
                    onFilter={async (z: string) => {
                      handleChange(arg.name, z);
                      await onFilter(arg.name, z)
                    }}
                    onChange={(v: string) => handleChange(arg.name, v)}
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
                    onChange={(e: any) => handleChange(arg.name, e.target.value)}
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
    </Modal>
  );
};
