// Simple disclaimer bar for chat, sticky at bottom, i18n text, appName and version from context
import { useChatContext } from "../context/ChatContext";
import { useTranslation } from "aihappey-i18n";
import { Link } from "react-router";
import { useIsDesktop } from "../../../shell/responsive/useIsDesktop";
import { normalizePrivacyPolicy } from "../../privacy/privacyPolicy";

const DisclaimerBar = () => {
  const { config } = useChatContext();
  const { t } = useTranslation();
  const appName = config.appName ?? "aihappey";
  const appVersion = config.appVersion ?? "";
  const isDesktop = useIsDesktop();
  const policy = normalizePrivacyPolicy(config.privacyPolicy);
  const linkStyle = { color: "inherit", textDecoration: "underline" };

  return (
    <div
      style={{
        width: "100%",
        position: "sticky",
        bottom: 0,
        left: 0,
        fontSize: 10,
        display: "flex",
        flexWrap: "wrap",
        rowGap: 4,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        padding: "0 16px",
        boxSizing: "border-box",
      }}
      data-testid="disclaimer-bar"
    >
      <span style={{ flex: "1 1 240px", textAlign: "center" }}>
        {t("disclaimer", { appName })}
      </span>
      {(policy || (isDesktop && appVersion)) && (
        <span
          style={{
            marginLeft: "auto",
            paddingLeft: 16,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {policy?.markdown ? (
            <Link to="/privacy" style={linkStyle}>
              {t("privacyPolicy.title")}
            </Link>
          ) : policy?.url ? (
            <a href={policy.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              {t("privacyPolicy.title")}
            </a>
          ) : null}
          {isDesktop && appVersion && <span>{appVersion}</span>}
        </span>
      )}
    </div>
  );
};

export { DisclaimerBar };
