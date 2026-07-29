import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

import { supportedLngs } from "./i18n.resources";
import { registerTimeagoLocales } from "./timeago";

export const initI18n = () => {
  registerTimeagoLocales();
  if (i18n.isInitialized) return i18n;

  i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {},
      partialBundledLanguages: true,
      ns: ["common", "providers", "mimeTypes", "regional"],
      defaultNS: "common",
      fallbackLng: "en",
      supportedLngs,
      load: "languageOnly",
      interpolation: { escapeValue: false },
      backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json",
      },
      detection: {
        order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
        lookupQuerystring: "lng",
        lookupCookie: "i18next",
        lookupLocalStorage: "i18nextLng",
        caches: ["localStorage", "cookie"],
      },
      react: {
        useSuspense: true,
      },
    });

  return i18n;
};
