import * as React from "react";
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuItemCheckbox,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  Avatar,
} from "@fluentui/react-components";
import {
  SettingsRegular,
  SignOutRegular,
  PersonSettingsRegular,
  KeyRegular,
  PlugConnectedRegular,
  PreviousRegular,
  NextRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
} from "@fluentui/react-icons";

import { UserMenuLabels } from "aihappey-types/src/i18n";

export interface UserMenuProps {
  email?: string;
  onCustomize?: () => void;
  onSettings: () => void;
  onLogout: () => void;

  showApiKeysItem?: boolean;
  onApiKeys?: () => void;

  providers?: string[];
  providerGroups?: Record<string, string[]>;
  enabledProviders?: string[];
  onToggleProvider?: (provider: string) => void;

  /** When true, provider toggles are disabled (e.g. while models are still loading). */
  providersDisabled?: boolean;
  /** Providers (by display name) that should be disabled (e.g. because they returned 0 models). */
  disabledProviders?: string[];

  className?: string;
  style?: React.CSSProperties;
  labels?: UserMenuLabels;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  email,
  onCustomize,
  onSettings,
  onLogout,
  showApiKeysItem,
  onApiKeys,
  providers,
  providerGroups,
  enabledProviders,
  onToggleProvider,
  providersDisabled,
  disabledProviders,
  className,
  style,
  labels = {},
}) => {
  const PAGE_SIZE = 10;
  const [providerPages, setProviderPages] = React.useState<Record<string, number>>({});

  const handleProvidersCheckedChange = React.useCallback(
    (_e: any, data: any) => {
      // Fluent Menu selection is managed via Menu.checkedValues.
      // We keep app state in sync using a toggle API.
      const nextChecked: string[] = data?.checkedItems ?? [];
      const prevChecked: string[] = enabledProviders ?? [];

      const changed = new Set<string>([...prevChecked, ...nextChecked]);
      for (const p of changed) {
        const wasOn = prevChecked.includes(p);
        const isOn = nextChecked.includes(p);
        if (wasOn !== isOn) onToggleProvider?.(p);
      }
    },
    [enabledProviders, onToggleProvider]
  );

  const trigger = (
    <Avatar
      name={email || "User"}
      color="colorful"
      size={32}
      style={{ fontWeight: 600, fontSize: 18 }}
    />
  );

  const capabilityMenus = React.useMemo(() => {
    const g = providerGroups ?? {};
    const defs: Array<{ key: string; label: string; providers: string[] }> = [
      {
        key: "language",
        label: labels.language ?? "Language",
        providers: g.language ?? [],
      },
      { key: "image", label: labels.image ?? "Image", providers: g.image ?? [] },
      {
        key: "transcription",
        label: labels.transcription ?? "Transcription",
        providers: g.transcription ?? [],
      },
      { key: "speech", label: labels.speech ?? "Speech", providers: g.speech ?? [] },
      {
        key: "reranking",
        label: labels.reranking ?? "Reranking",
        providers: g.reranking ?? [],
      },
      { key: "video", label: labels.video ?? "Video", providers: g.video ?? [] },
    ];

    return defs
      .map((d) => {
        const total = d.providers?.length ?? 0;
        const enabled = (enabledProviders ?? []).filter((p) =>
          (d.providers ?? []).includes(p)
        ).length;
        return {
          ...d,
          label: `${d.label} (${enabled}/${total})`,
        };
      })
      .filter((d) => (d.providers?.length ?? 0) > 0);
  }, [providerGroups, labels, enabledProviders]);

  const clampProviderPage = React.useCallback(
    (key: string, totalItems: number) => {
      setProviderPages((prev) => {
        const maxPage = Math.max(0, Math.ceil(totalItems / PAGE_SIZE) - 1);
        const current = prev[key] ?? 0;
        const next = Math.min(current, maxPage);
        if (next === current) return prev;
        return { ...prev, [key]: next };
      });
    },
    [PAGE_SIZE]
  );

  React.useEffect(() => {
    capabilityMenus.forEach((cap) => clampProviderPage(cap.key, cap.providers.length));
    if (providers) clampProviderPage("flat", providers.length);
  }, [capabilityMenus, providers, clampProviderPage]);

  const getProviderPage = React.useCallback(
    (key: string) => providerPages[key] ?? 0,
    [providerPages]
  );

  const setProviderPage = React.useCallback((key: string, nextPage: number) => {
    setProviderPages((prev) => ({ ...prev, [key]: nextPage }));
  }, []);

  const renderPagedProviders = React.useCallback(
    (
      key: string,
      list: string[],
      renderItem: (provider: string) => React.ReactNode
    ) => {
      const page = getProviderPage(key);
      const totalPages = Math.ceil(list.length / PAGE_SIZE);
      const startIndex = page * PAGE_SIZE;
      const pageItems = list.slice(startIndex, startIndex + PAGE_SIZE);
      const showPrev = page > 0;
      const showNext = page < totalPages - 1;

      return (
        <>
          {showPrev && (
            <>
              <MenuItem
                key={`${key}:prev`}
                icon={<ChevronLeftRegular />}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setProviderPage(key, page - 1);
                }}
              >
                {labels.previous ?? "Previous"}
              </MenuItem>
              <MenuDivider />
            </>
          )}
          {pageItems.map((provider) => renderItem(provider))}
          {showNext && (
            <>
              <MenuDivider />
              <MenuItem
                key={`${key}:next`}
                icon={<ChevronRightRegular />}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setProviderPage(key, page + 1);
                }}
              >
                {labels.next ?? "Next"}
              </MenuItem>
            </>
          )}
        </>
      );
    },
    [getProviderPage, labels.next, labels.previous, setProviderPage, PAGE_SIZE]
  );

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <span style={{ cursor: "pointer" }} className={className} tabIndex={0}>
          {trigger}
        </span>
      </MenuTrigger>
      <MenuPopover style={style}>
        <MenuList hasCheckmarks>
          {email && (
            <>
              <MenuGroup>
                <MenuGroupHeader>{email}</MenuGroupHeader>
              </MenuGroup>
            </>
          )}


          {onCustomize && <MenuItem icon={<PersonSettingsRegular />} onClick={onCustomize}>
            {labels.customize ?? "Customize"}
          </MenuItem>}


          <MenuItem icon={<SettingsRegular />} onClick={onSettings}>
            {labels.settings ?? "Settings"}
          </MenuItem>

          {!!providers?.length && !!onToggleProvider && (
            <Menu
              persistOnItemClick
              checkedValues={{ providers: enabledProviders ?? [] }}
              onCheckedValueChange={handleProvidersCheckedChange}
            >
              <MenuTrigger disableButtonEnhancement>
                <MenuItem icon={<PlugConnectedRegular />}>{(labels.providers ?? "Providers")
                  + (enabledProviders != undefined ? " (" + enabledProviders?.length + "/" + providers.length + ")" : "")} </MenuItem>
              </MenuTrigger>
              <MenuPopover>
                <MenuList hasCheckmarks>
                  {!!showApiKeysItem && !!onApiKeys && (
                    <>
                      <MenuItem icon={<KeyRegular />}
                        onClick={onApiKeys}>
                        {labels.apiKeys ?? "API keys"}
                      </MenuItem>
                      <MenuDivider />
                    </>
                  )}

                  {capabilityMenus.length > 0 ? (
                    <>
                      {capabilityMenus.map((cap) => (
                        <Menu
                          key={cap.key}
                          persistOnItemClick
                          // Important: MenuItemCheckbox state is scoped to the nearest <Menu>.
                          // Without wiring checkedValues here, checkmarks won't reflect app state,
                          // and toggles won't call our handler.
                          checkedValues={{ providers: enabledProviders ?? [] }}
                          onCheckedValueChange={handleProvidersCheckedChange}
                        >
                          <MenuTrigger disableButtonEnhancement>
                            <MenuItem>{cap.label}</MenuItem>
                          </MenuTrigger>
                          <MenuPopover>
                            <MenuList hasCheckmarks>
                              {renderPagedProviders(cap.key, cap.providers, (p) => (
                                <MenuItemCheckbox
                                  key={`${cap.key}:${p}`}
                                  name="providers"
                                  value={p}
                                  disabled={!!providersDisabled || !!disabledProviders?.includes(p)}
                                >
                                  {p}
                                </MenuItemCheckbox>
                              ))}
                            </MenuList>
                          </MenuPopover>
                        </Menu>
                      ))}
                    </>
                  ) : (
                    // Fallback: legacy flat list
                    renderPagedProviders("flat", providers, (p) => (
                      <MenuItemCheckbox
                        key={p}
                        name="providers"
                        value={p}
                        disabled={!!providersDisabled || !!disabledProviders?.includes(p)}
                      >
                        {p}
                      </MenuItemCheckbox>
                    ))
                  )}
                </MenuList>
              </MenuPopover>
            </Menu>
          )}

          <MenuDivider />
          <MenuItem icon={<SignOutRegular />} onClick={onLogout}>
            {labels.logout ?? "Log out"}
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
