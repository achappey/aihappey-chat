import { PromptArgumentsForm, useTheme } from "aihappey-components";
import { usePromptArguments } from "./usePromptArguments";
import { PromptWithSource } from "./PromptSelectButton";
import { CancelButton } from "../../ui/buttons/CancelButton";
import { useTranslation } from "aihappey-i18n";

type Props = {
  open: boolean
  prompt?: PromptWithSource | undefined;
  onHide: () => void;
  onPromptExecute?: any;
};

export const PromptArgumentsModal = ({
  prompt,
  open,
  onHide,
  onPromptExecute,
}: Props) => {
  const { Modal, Button, Spinner } = useTheme();
  const { t } = useTranslation()

  const {
    values,
    handleChange,
    completions,
    error,
    pending,
    missingRequired,
    handleOk,
    onFilter,
  } = usePromptArguments({ prompt, onPromptExecute });

  return (
    <Modal
      show={open}
      onHide={onHide}
      actions={
        <>
          <CancelButton disabled={pending} onClick={onHide} />
          <Button
            type="button"
            onClick={() => handleOk(onHide)}
            disabled={pending || missingRequired}
          >
            {pending ? <Spinner size="sm" /> : t('execute')}
          </Button>
        </>
      }
      title={prompt?.title ?? prompt?.name ?? ""}>
      <PromptArgumentsForm
        arguments={prompt?.arguments ?? []}
        values={values}
        completions={completions}
        pending={pending}
        missingRequired={missingRequired}
        error={error}
        onChange={handleChange}
        onFilter={onFilter}
        onSubmit={() => handleOk(onHide)}
      />
    </Modal>
  );
};
