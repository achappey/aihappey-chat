import { ReactNode, useEffect, useRef } from "react";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";
import { initI18n } from "./i18n";

type I18nProviderProps = {
  children: ReactNode;
  locale?: string;
};

export const I18nProvider = ({ children, locale }: I18nProviderProps) => {
  const i18nRef = useRef<I18nInstance | null>(null);

  if (!i18nRef.current) {
    i18nRef.current = initI18n();
  }

  useEffect(() => {
    if (locale && i18nRef.current?.language !== locale) {
      i18nRef.current?.changeLanguage(locale);
    }
  }, [locale]);

  return (
    <I18nextProvider i18n={i18nRef.current!}>
      {children}
    </I18nextProvider>
  );
};
