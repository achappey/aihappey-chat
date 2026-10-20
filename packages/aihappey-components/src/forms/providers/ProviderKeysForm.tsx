import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../theme/ThemeContext";

export type ProviderKeyItem = {
  id: string;
  name: string;
  header: string;
  iconSrc?: string;
  url?: string;
  searchText?: string;
};

export interface ProviderKeysFormProps {
  items: ProviderKeyItem[];
  values: Record<string, string | undefined>;
  onChange: (header: string, value: string) => void | Promise<void>;
  onRemove: (header: string) => void;
  title?: string;
  apiKeyLabel?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

export const ProviderKeysForm: React.FC<ProviderKeysFormProps> = ({
  items,
  values,
  onChange,
  onRemove,
  title,
  apiKeyLabel = "API key",
  disabled = false,
  disabledMessage,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [editingHeader, setEditingHeader] = useState<string | undefined>();
  const [selectedHeader, setSelectedHeader] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [visibleHeaders, setVisibleHeaders] = useState<Set<string>>(
    () => new Set()
  );

  const resetEditor = () => {
    setEditingHeader(undefined);
    setSelectedHeader("");
    setDraftKey("");
    setSearch("");
    setSaveError(false);
  };

  useEffect(() => {
    if (disabled) {
      resetEditor();
      setVisibleHeaders(new Set());
    }
  }, [disabled]);

  const configuredItems = items.filter((item) => values[item.header]?.trim());
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (values[item.header]?.trim()) return false;
      const haystack = [item.id, item.name, item.header, item.url, item.searchText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [items, search, values]);

  const selectedItem = items.find((item) => item.header === selectedHeader);
  const canSave = !disabled && !saving && !!draftKey.trim() && !!selectedItem
    && (editingHeader !== "" || !values[selectedHeader]?.trim());

  const saveKey = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(false);
    try {
      await onChange(selectedHeader, draftKey);
      setVisibleHeaders((current) => {
        const next = new Set(current);
        next.delete(selectedHeader);
        return next;
      });
      resetEditor();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const toggleHeaderVisibility = (header: string) => {
    setVisibleHeaders((current) => {
      const next = new Set(current);
      if (next.has(header)) {
        next.delete(header);
      } else {
        next.add(header);
      }
      return next;
    });
  };

  const handleRemove = (header: string) => {
    setVisibleHeaders((current) => {
      if (!current.has(header)) return current;

      const next = new Set(current);
      next.delete(header);
      return next;
    });
    onRemove(header);
  };

  return (
    <theme.Card size="small" title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {disabledMessage ? <theme.Alert variant="warning">{disabledMessage}</theme.Alert> : null}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <theme.Button
            icon="add"
            size="small"
            variant="subtle"
            title={t("add")}
            aria-label={t("add")}
            disabled={disabled || saving || configuredItems.length === items.length}
            onClick={() => {
              resetEditor();
              setEditingHeader("");
            }}
          />
        </div>

        {editingHeader !== undefined && !disabled ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {editingHeader === "" ? (
              <>
                <theme.SearchBox
                  value={search}
                  placeholder={t("search")}
                  aria-label={t("search")}
                  disabled={saving}
                  onChange={(value: string) => setSearch(value)}
                />
                <theme.Select
                  values={selectedHeader ? [selectedHeader] : []}
                  valueTitle={selectedItem?.name}
                  label={t("providers")}
                  placeholder={t("providers")}
                  aria-label={t("providers")}
                  disabled={saving}
                  onChange={(value: any) => setSelectedHeader(value?.target?.value ?? value)}
                >
                  {filteredItems.map((item) => (
                    <option key={item.header} value={item.header}>{item.name}</option>
                  ))}
                </theme.Select>
                {filteredItems.length === 0 ? <span>{t("noResults")}</span> : null}
              </>
            ) : <strong>{selectedItem?.name}</strong>}
            <theme.Input
              type="password"
              label={apiKeyLabel}
              aria-label={apiKeyLabel}
              value={draftKey}
              autoComplete="off"
              disabled={saving}
              onChange={(e: any) => setDraftKey(e.target.value)}
            />
            {saveError ? <theme.Alert variant="danger">{t("error")}</theme.Alert> : null}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <theme.Button variant="subtle" disabled={saving} onClick={resetEditor}>
                {t("cancel")}
              </theme.Button>
              <theme.Button variant="primary" disabled={!canSave} onClick={saveKey}>
                {t("save")}
              </theme.Button>
            </div>
          </div>
        ) : null}

        {configuredItems.map((item) => {
          const value = values[item.header] ?? "";
          const isVisible = visibleHeaders.has(item.header);

          return (
            <div
              key={item.header}
              style={{
                display: "grid",
                gridTemplateColumns: "32px minmax(7rem, 13rem) minmax(0, 1fr) auto auto auto",
                gap: "0.5rem",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div style={{ display: "inline-flex", justifyContent: "center", lineHeight: 0, width: 32 }}>
                {item.iconSrc ? (
                  item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      title={t("website")}
                      aria-label={t("website")}
                      style={{ display: "inline-flex", lineHeight: 0 }}
                    >
                      <theme.Image width={24} src={item.iconSrc} />
                    </a>
                  ) : (
                    <theme.Image width={24} src={item.iconSrc} />
                  )
                ) : null}
              </div>

              <div style={{ minWidth: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>
                {item.name}
              </div>

              <div style={{ minWidth: 0 }}>
                <theme.Input
                  type={isVisible ? "text" : "password"}
                  value={value}
                  style={{ width: "100%" }}
                  placeholder={`${item.name} ${apiKeyLabel}...`}
                  autoComplete="off"
                  aria-label={`${item.name} ${apiKeyLabel}`}
                  readOnly
                  disabled={disabled}
                />
              </div>

              <theme.Button
                icon="eye"
                variant={isVisible ? "primary" : "subtle"}
                size="small"
                disabled={disabled || saving || !value}
                title={t("view")}
                aria-label={t("view")}
                onClick={() => toggleHeaderVisibility(item.header)}
              />

              <theme.Button
                icon="edit"
                variant="subtle"
                size="small"
                title={t("edit")}
                aria-label={`${t("edit")} ${item.name}`}
                disabled={disabled || saving}
                onClick={() => {
                  resetEditor();
                  setEditingHeader(item.header);
                  setSelectedHeader(item.header);
                  setDraftKey(value);
                }}
              />

              <theme.Button
                icon="delete"
                variant="danger"
                size="small"
                title={t("delete")}
                aria-label={t("delete")}
                disabled={disabled || saving || !value}
                onClick={() => {
                  if (editingHeader === item.header) resetEditor();
                  handleRemove(item.header);
                }}
              />
            </div>
          );
        })}
      </div>
    </theme.Card>
  );
};
