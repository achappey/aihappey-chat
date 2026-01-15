import React, { useEffect, useState } from "react";
import { languageNames, useTranslation } from "aihappey-i18n";
import { useAccount } from "aihappey-auth";
import { useIsDesktop } from "../../../shell/responsive/useIsDesktop";
import { useTheme } from "aihappey-components";
import { fetchWelcomeMessage } from "../../../runtime/chat-app/welcomeMessage";
import { useAppStore } from "aihappey-state";

interface WelcomeMessageProps { }

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ }) => {
  const { Skeleton } = useTheme();
  const { i18n } = useTranslation();
  const account = useAccount()
  const models = useAppStore((s) => s.models);
  const [welcomeMessage, setWelcomeMessage] = useState<string | undefined>(
    undefined
  );

  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (models && models?.length > 0)
      fetchWelcomeMessage((languageNames as any)[i18n.language as any],
        account?.name)
        .then(a =>
          setWelcomeMessage(a)
        );

  }, [i18n.language, models]);

  return (
    <>
      {welcomeMessage ? (
        isDesktop ? (
          <h1>{welcomeMessage}</h1>
        ) : (
          <h2>{welcomeMessage}</h2>
        )
      ) : (
        <Skeleton
          width={350}
          height={36}
          style={{
            lineHeight: 36,
            marginBlockEnd: "0.67em",
            marginBlockStart: "0.67em",
            display: "inline-block",
            boxSizing: "border-box",
          }}
        />
      )}
    </>
  );
};
