import { Navigate } from "react-router";
import { useTranslation } from "aihappey-i18n";
import { useChatContext } from "../chat/context/ChatContext";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { Markdown } from "../../ui/markdown/Markdown";
import { normalizePrivacyPolicy } from "./privacyPolicy";

export const PrivacyPolicyPage = () => {
  const { config } = useChatContext();
  const { t } = useTranslation();
  const policy = normalizePrivacyPolicy(config.privacyPolicy);

  // URL-only policies are linked directly from the footer, not rendered here.
  if (!policy?.markdown) return <Navigate to="/" replace />;

  return (
    <main
      style={{
        width: 980,
        maxWidth: "100%",
        margin: "0 auto",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
      data-testid="privacy-policy-page"
    >
      <OverviewPageHeader title={t("privacyPolicy.title")} />
      <article style={{ marginTop: 24, overflowWrap: "anywhere" }}>
        <Markdown text={policy.markdown} />
      </article>
      {policy.url && (
        <p style={{ marginTop: 24 }}>
          <a
            href={policy.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            {t("privacyPolicy.externalLink")}
          </a>
        </p>
      )}
    </main>
  );
};
