import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/en.json';
import enProviders from './locales/en/providers.json';
import nlCommon from './locales/nl/nl.json';
import nlProviders from './locales/nl/providers.json';
import LanguageDetector from 'i18next-browser-languagedetector';

export const initI18n = () => {
  if (i18n.isInitialized) return i18n;
  i18n
    .use(LanguageDetector) // plugin toevoegen!
    .use(initReactI18next)
    .init({
      resources: {
        en: { common: enCommon, providers: enProviders },
        nl: { common: nlCommon, providers: nlProviders }
      },
      //lng,
      ns: ["common", "providers"],   // bekende namespaces
      defaultNS: "common",            // 👈 dit is je default
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      supportedLngs: ['en', 'nl'],
      detection: {
        order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
        lookupQuerystring: 'lng',
        lookupCookie: 'i18next',
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage', 'cookie']
      },
    });
  return i18n;
}
