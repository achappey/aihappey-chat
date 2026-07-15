import { createElement, useEffect, useRef, type ReactNode } from "react";
import i18next, { createInstance, type i18n as I18nInstance, type Resource } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { I18nextProvider, Trans, useTranslation } from "react-i18next";
import { docsI18nResources } from "./resources";

export const docsI18nNamespace = "docs";

export const docsSupportedLocales = ["en", "nl"] as const;

export type DocsLocale = typeof docsSupportedLocales[number];

export type DocsLanguageOption = {
  locale: DocsLocale;
  label: string;
  nativeLabel: string;
};

export const docsLanguageOptions: DocsLanguageOption[] = [
  { locale: "en", label: "English", nativeLabel: "English" },
  { locale: "nl", label: "Dutch", nativeLabel: "Nederlands" },
];

const resources = docsI18nResources as Resource;

let docsI18nInstance: I18nInstance | null = null;

export const initDocsI18n = () => {
  if (docsI18nInstance) return docsI18nInstance;

  docsI18nInstance = createInstance();
  docsI18nInstance
    .use(LanguageDetector)
    .init({
      resources,
      ns: [docsI18nNamespace],
      defaultNS: docsI18nNamespace,
      fallbackLng: "en",
      supportedLngs: docsSupportedLocales,
      load: "languageOnly",
      interpolation: { escapeValue: false },
      detection: {
        order: ["querystring", "localStorage", "navigator", "htmlTag"],
        lookupQuerystring: "docsLng",
        lookupLocalStorage: "aihappeyDocsLng",
        caches: ["localStorage"],
      },
      react: {
        useSuspense: false,
      },
    });

  return docsI18nInstance;
};

export type DocsI18nProviderProps = {
  children: ReactNode;
  locale?: DocsLocale;
};

export const DocsI18nProvider = ({ children, locale }: DocsI18nProviderProps) => {
  const i18nRef = useRef<I18nInstance | null>(null);

  if (!i18nRef.current) {
    i18nRef.current = initDocsI18n();
  }

  useEffect(() => {
    if (locale && i18nRef.current?.language !== locale) {
      i18nRef.current?.changeLanguage(locale);
    }
  }, [locale]);

  return createElement(I18nextProvider, { i18n: i18nRef.current! }, children);
};

export const useDocsTranslation = () => useTranslation(docsI18nNamespace);

export { i18next as docsI18next, Trans, useTranslation };
