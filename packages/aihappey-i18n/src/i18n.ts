import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { resources, supportedLngs } from "./i18n.resources";
import { registerTimeagoLocales } from "./timeago";

export const initI18n = () => {
  registerTimeagoLocales();
  if (i18n.isInitialized) return i18n;

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      ns: ["common", "providers", "mimeTypes", "regional"],
      defaultNS: "common",
      fallbackLng: "en",
      supportedLngs,
      interpolation: { escapeValue: false },
      detection: {
        order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
        lookupQuerystring: "lng",
        lookupCookie: "i18next",
        lookupLocalStorage: "i18nextLng",
        caches: ["localStorage", "cookie"],
      },
    });

  return i18n;
};
