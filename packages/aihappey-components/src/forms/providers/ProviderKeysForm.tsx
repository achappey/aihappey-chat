import React, { useMemo, useState } from "react";
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
  onChange: (header: string, value: string) => void;
  onRemove: (header: string) => void;
  title?: string;
  apiKeyLabel?: string;
}

export const ProviderKeysForm: React.FC<ProviderKeysFormProps> = ({
  items,
  values,
  onChange,
  onRemove,
  title,
  apiKeyLabel = "API key",
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [visibleHeaders, setVisibleHeaders] = useState<Set<string>>(
    () => new Set()
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const haystack = [item.id, item.name, item.header, item.url, item.searchText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [items, search]);

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
        <theme.SearchBox
          value={search}
          placeholder={t("search")}
          aria-label={t("search")}
          onChange={(e: any) => setSearch(e)}
        />

        {filteredItems.map((item) => {
          const value = values[item.header] ?? "";
          const isVisible = visibleHeaders.has(item.header);

          return (
            <div
              key={item.header}
              style={{
                display: "grid",
                gridTemplateColumns: "32px minmax(7rem, 13rem) minmax(0, 1fr) auto auto",
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
                  onChange={(e: any) =>
                    onChange(item.header, e.target.value)
                  }
                />
              </div>

              <theme.Button
                icon="eye"
                variant={isVisible ? "primary" : "subtle"}
                size="small"
                disabled={!value}
                title={t("view")}
                aria-label={t("view")}
                onClick={() => toggleHeaderVisibility(item.header)}
              />

              <theme.Button
                icon="delete"
                variant="danger"
                size="small"
                title={t("delete")}
                aria-label={t("delete")}
                disabled={!value}
                onClick={() => handleRemove(item.header)}
              />
            </div>
          );
        })}
      </div>
    </theme.Card>
  );
};
