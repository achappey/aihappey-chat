import { useAppStore } from "aihappey-state";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { McpRegistryServerResponse } from "aihappey-types";
import { useMcpHeadersEditor } from "./useMcpHeadersEditor";

type Props = {
  show: boolean;
  onHide: () => void;
  name: string;
  registry?: McpRegistryServerResponse;
  onSaveHeaders?: (headers: Record<string, string>) => void;
};

export const EditServerModal = (props: Props) => props.show ? <EditServerForm key={props.name} {...props} /> : null;

const EditServerForm = ({ show, onHide, name, registry: suppliedRegistry, onSaveHeaders }: Props) => {
  const { Modal, Button, Input } = useTheme();
  const { t } = useTranslation();
  const updateMcpServer = useAppStore(s => s.updateMcpServer);
  const addMcpServer = useAppStore(s => s.addMcpServer);
  const item = useAppStore(s => s.mcpServers[name]);
  const registries = useAppStore(s => s.mcpRegistries);
  const freshRegistry = item && Object.values(registries ?? {}).flat().find(entry => entry?.server?.name?.toLowerCase() === name
    && entry.server.remotes?.some(remote => remote?.url === item.config.url));
  const registry = suppliedRegistry ?? freshRegistry ?? item?.registry;
  const url = item?.config.url ?? registry?.server?.remotes?.find(remote => remote?.type === "streamable-http")?.url;
  const editor = useMcpHeadersEditor(item?.config.headers, registry, url);
  const save = () => {
    if (!editor.headers || editor.error) return;
    if (onSaveHeaders) onSaveHeaders(editor.headers);
    else if (item && freshRegistry) addMcpServer(name, { ...item, registry: freshRegistry, config: { ...item.config, headers: editor.headers } });
    else if (item) updateMcpServer(name, { ...item.config, headers: editor.headers });
    onHide();
  };
  if (!url) return null;
  return <Modal show={show} onHide={onHide} title={t("edit")} actions={<>
    <Button onClick={onHide} variant="subtle" type="button">{t("cancel")}</Button>
    <Button onClick={save} disabled={!!editor.error} type="button">{t("ok")}</Button>
  </>}>
    <Input label={t("manageServersModal.name")} value={registry?.server?.title ?? name} disabled />
    <Input label={t("manageServersModal.url")} value={url} disabled />
    {editor.content}
  </Modal>;
};
