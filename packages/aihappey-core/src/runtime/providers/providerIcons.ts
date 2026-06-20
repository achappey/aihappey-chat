import type { Provider } from "aihappey-types";

const DEFAULT_FAVICON_SIZE = 128;

export const buildGstaticFaviconUrl = (url: string, size = DEFAULT_FAVICON_SIZE) =>
  `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=${size}`;

const buildProviderFallbackIcons = (provider: Provider) => {
  const homepage = provider.urls?.homepage;
  if (!homepage) return undefined;

  return [{ src: buildGstaticFaviconUrl(homepage) }];
};

export const withProviderIconFallbacks = <TProviders extends Record<string, Provider>>(
  providers: TProviders
): TProviders => {
  return Object.fromEntries(
    Object.entries(providers).map(([key, provider]) => {
      if (provider.icons?.length) return [key, provider];

      const icons = buildProviderFallbackIcons(provider);
      if (!icons?.length) return [key, provider];

      return [key, { ...provider, icons }];
    })
  ) as TProviders;
};
