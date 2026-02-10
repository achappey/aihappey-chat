import { ResourceTemplateArgumentsForm, useTheme } from "aihappey-components";
import type { ResourceTemplate } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { CancelButton } from "../../../ui/buttons/CancelButton";
import { useResourceTemplateArguments } from "./useResourceTemplateArguments";
import { extractTemplateParams } from "./resourceTemplateUri";

type Props = {
  open: boolean;
  serverKey?: string;
  resourceTemplate?: ResourceTemplate;
  onHide: () => void;
  onExecute: (argumentsMap: Record<string, string>) => Promise<void>;
};

export const ResourceTemplateArgumentsModal = ({
  open,
  serverKey,
  resourceTemplate,
  onHide,
  onExecute,
}: Props) => {
  const { Modal, Button, Spinner } = useTheme();
  const { t } = useTranslation();

  const argumentNames = extractTemplateParams(resourceTemplate?.uriTemplate ?? "");

  const {
    values,
    handleChange,
    completions,
    error,
    pending,
    setPending,
    setError,
    onFilter,
  } = useResourceTemplateArguments({
    serverKey,
    uriTemplate: resourceTemplate?.uriTemplate,
    argumentNames,
  });

  const handleOk = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onExecute(values);
      onHide();
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to execute resource template");
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      show={open}
      onHide={onHide}
      actions={
        <>
          <CancelButton disabled={pending} onClick={onHide} />
          <Button type="button" onClick={handleOk} disabled={pending}>
            {pending ? <Spinner size="sm" /> : t("execute")}
          </Button>
        </>
      }
      title={resourceTemplate?.title ?? resourceTemplate?.name ?? t("mcp.resourceTemplates")}
    >
      <ResourceTemplateArgumentsForm
        argumentNames={argumentNames}
        values={values}
        completions={completions}
        pending={pending}
        error={error}
        onChange={handleChange}
        onFilter={onFilter}
        onSubmit={handleOk}
      />
    </Modal>
  );
};

