import { useCopyToClipboard, useDarkMode } from "usehooks-ts";
import { OpenLinkButton, useTheme } from "aihappey-components";

import type { Prompt } from "aihappey-mcp";
import { useTranslation } from "aihappey-i18n";

type PromptCardProps = {
  prompt: Prompt & { _url?: string; text?: string };
  onSelect?: () => void;
};

export const PromptCard = ({ prompt, onSelect }: PromptCardProps) => {
  const { Card, Button, Image } = useTheme();
  const [, copyToClipboard] = useCopyToClipboard();
  const { t } = useTranslation();
  const rootUrl = window.location.origin; // e.g. "https://fakton.crm4.dynamics.com"
  const params = new URLSearchParams({
    mcpServer: encodeURI(prompt._url!),
    promptName: prompt.name,
  }).toString();

  const customUrl = `${rootUrl}/?${params}`;
  const isDarkMode = useDarkMode();

  const icon = prompt?.icons?.find(i => i.theme === (isDarkMode ? "dark" : "light"))?.src
    ?? prompt?.icons?.[0]?.src;

  const image = icon ? <Image src={icon}
    height={32}
    shape="square"></Image> : undefined

  return (
    <Card
      title={prompt.title ?? prompt.name}
      image={image}
      size="small"
      actions={
        <>
          <Button
            onClick={onSelect}
            variant="transparent"
            icon="add"
            size="small"
          />
          <OpenLinkButton
            url={customUrl}
            variant="transparent"
            title={t("newWindow")}
            size="small"
          />
          <Button
            onClick={() => copyToClipboard(customUrl)}
            variant="transparent"
            title={t("copyLink")}
            icon="copyClipboard"
            size="small"
          />
        </>
      }
    >{prompt.description || prompt.text}</Card>
  );
};
