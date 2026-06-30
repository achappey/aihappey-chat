import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

export type ApiKeyPasswordModalMode = "set" | "change" | "unlock";

export type ApiKeyPasswordModalSubmitValues = {
  password: string;
  currentPassword?: string;
};

export type ApiKeyPasswordModalProps = {
  open: boolean;
  mode: ApiKeyPasswordModalMode;
  busy?: boolean;
  error?: string;
  onSubmit: (values: ApiKeyPasswordModalSubmitValues) => void | Promise<void>;
  onClose: () => void;
};

export const ApiKeyPasswordModal = ({
  open,
  mode,
  busy = false,
  error,
  onSubmit,
  onClose,
}: ApiKeyPasswordModalProps) => {
  const { Modal, Button, Input, Alert } = useTheme();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
    }
  }, [open]);

  const title = mode === "set"
    ? t("apiKeysPassword.setTitle")
    : mode === "change"
      ? t("apiKeysPassword.changeTitle")
      : t("apiKeysPassword.unlockTitle");

  const submitLabel = mode === "set"
    ? t("apiKeysPassword.setPassword")
    : mode === "change"
      ? t("apiKeysPassword.changePassword")
      : t("apiKeysPassword.unlock");

  const validationError = useMemo(() => {
    if (mode === "change" && !currentPassword.trim()) return t("apiKeysPassword.currentRequired");
    if (!password.trim()) return t("apiKeysPassword.passwordRequired");
    if (mode !== "unlock" && password !== confirmPassword) return t("apiKeysPassword.passwordsDoNotMatch");
    return undefined;
  }, [confirmPassword, currentPassword, mode, password, t]);

  const handleSubmit = () => {
    if (validationError || busy) return;
    void onSubmit({
      password,
      currentPassword: mode === "change" ? currentPassword : undefined,
    });
  };

  return (
    <Modal
      show={open}
      onHide={() => {
        if (!busy) onClose();
      }}
      title={title}
      modalType={mode === "unlock" ? "alert" : undefined}
      actions={(
        <>
          {mode !== "unlock" ? (
            <Button variant="secondary" disabled={busy} onClick={onClose}>
              {t("cancel")}
            </Button>
          ) : null}
          <Button variant="primary" disabled={!!validationError || busy} onClick={handleSubmit}>
            {submitLabel}
          </Button>
        </>
      )}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: 320 }}>
        <div>{t(`apiKeysPassword.${mode}Description`)}</div>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {mode === "change" ? (
          <Input
            type="password"
            label={t("apiKeysPassword.currentPassword")}
            autoComplete="current-password"
            value={currentPassword}
            disabled={busy}
            onChange={(e: any) => setCurrentPassword(e.target.value)}
          />
        ) : null}
        <Input
          type="password"
          label={mode === "unlock" ? t("apiKeysPassword.password") : t("apiKeysPassword.newPassword")}
          autoComplete={mode === "unlock" ? "current-password" : "new-password"}
          value={password}
          disabled={busy}
          onChange={(e: any) => setPassword(e.target.value)}
          onKeyDown={(e: any) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        {mode !== "unlock" ? (
          <Input
            type="password"
            label={t("apiKeysPassword.confirmPassword")}
            autoComplete="new-password"
            value={confirmPassword}
            disabled={busy}
            onChange={(e: any) => setConfirmPassword(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
        ) : null}
      </div>
    </Modal>
  );
};

