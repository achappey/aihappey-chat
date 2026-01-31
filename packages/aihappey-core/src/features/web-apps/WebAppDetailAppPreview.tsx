import { ActionProvider, DataProvider, VisibilityProvider } from "@json-render/react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";
import { Renderer } from "../json-render/Renderer";

type WebAppDetailAppPreviewProps = {
  loading: boolean;
  error?: string;
  app?: {
    data?: any;
  } | null;
  effectiveTree?: any;
  streamingError?: string;
  streaming?: boolean;
  chatStreaming?: boolean;
  registry: any;
  actionHandlers: any;
};

export const WebAppDetailAppPreview = ({
  loading,
  error,
  app,
  effectiveTree,
  streamingError,
  streaming,
  chatStreaming,
  registry,
  actionHandlers,
}: WebAppDetailAppPreviewProps) => {
  const { t } = useTranslation();
  const { Text, Alert, Spinner } = useTheme();

  if (loading) {
    return <Text as="p" align={"center" }>{t("loading")}</Text>;
  }

  if (error) {
    return <Text as="p" align={"center" }>{error}</Text>;
  }

  if (!app) {
    return <Text as="p" align={"center" }>{t("notFound")}</Text>;
  }

  return (
    <div style={{ width: "100%" }}>
      {streamingError ? (
        <Alert variant="warning">{streamingError}</Alert>
      ) : null}
      {streaming || chatStreaming ? (
        <div style={{ textAlign: "center", padding: 8 }}>
          <Spinner />
        </div>
      ) : null}
      {!effectiveTree ? (
        <div style={{ color: "#888", textAlign: "center" }}>{t("noResults")}</div>
      ) : (
        <ErrorBoundary fallbackRender={(er) => "Something went wrong:" + er.error}>
          <DataProvider initialData={app?.data ?? {}}>
            <VisibilityProvider>
              <ActionProvider handlers={actionHandlers}>
                <Renderer tree={effectiveTree} registry={registry} />
              </ActionProvider>
            </VisibilityProvider>
          </DataProvider>
        </ErrorBoundary>
      )}
    </div>
  );
};
