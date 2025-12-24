import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/en.json';
import enProviders from './locales/en/providers.json';

import nlCommon from './locales/nl/nl.json';
import nlProviders from './locales/nl/providers.json';

import deCommon from './locales/de/de.json';
import deProviders from './locales/de/providers.json';

import esCommon from './locales/es/es.json';
import esProviders from './locales/es/providers.json';

import frCommon from './locales/fr/fr.json';
import frProviders from './locales/fr/providers.json';

import ptCommon from './locales/pt/pt.json';
import ptProviders from './locales/pt/providers.json';

export const initI18n = () => {
  if (i18n.isInitialized) return i18n;

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { common: enCommon, providers: enProviders },
        nl: { common: nlCommon, providers: nlProviders },
        de: { common: deCommon, providers: deProviders },
        es: { common: esCommon, providers: esProviders },
        fr: { common: frCommon, providers: frProviders },
        pt: { common: ptCommon, providers: ptProviders }
      },
      ns: ['common', 'providers'],
      defaultNS: 'common',
      fallbackLng: 'en',
      supportedLngs: ['en', 'nl', 'de', 'es', 'fr', 'pt'],
      interpolation: { escapeValue: false },
      detection: {
        order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
        lookupQuerystring: 'lng',
        lookupCookie: 'i18next',
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage', 'cookie']
      }
    });

  return i18n;
};
