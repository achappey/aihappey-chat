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

import hiCommon from './locales/hi/hi.json';
import hiProviders from './locales/hi/providers.json';

import itCommon from './locales/it/it.json';
import itProviders from './locales/it/providers.json';

import plCommon from './locales/pl/pl.json';
import plProviders from './locales/pl/providers.json';

import trCommon from './locales/tr/tr.json';
import trProviders from './locales/tr/providers.json';

import huCommon from './locales/hu/hu.json';
import huProviders from './locales/hu/providers.json';

import ruCommon from './locales/ru/ru.json';
import ruProviders from './locales/ru/providers.json';

/* NEW LANGUAGES */
import jaCommon from './locales/ja/ja.json';
import jaProviders from './locales/ja/providers.json';

import viCommon from './locales/vi/vi.json';
import viProviders from './locales/vi/providers.json';

import thCommon from './locales/th/th.json';
import thProviders from './locales/th/providers.json';

import roCommon from './locales/ro/ro.json';
import roProviders from './locales/ro/providers.json';

import idCommon from './locales/id/id.json';
import idProviders from './locales/id/providers.json';

import bnCommon from './locales/bn/bn.json';
import bnProviders from './locales/bn/providers.json';

import { registerTimeagoLocales } from './timeago';

export const initI18n = () => {
  registerTimeagoLocales();
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
        pt: { common: ptCommon, providers: ptProviders },
        hi: { common: hiCommon, providers: hiProviders },

        bn: { common: bnCommon, providers: bnProviders },
        it: { common: itCommon, providers: itProviders },
        pl: { common: plCommon, providers: plProviders },
        tr: { common: trCommon, providers: trProviders },
        hu: { common: huCommon, providers: huProviders },
        ru: { common: ruCommon, providers: ruProviders },

        /* NEW */
        ja: { common: jaCommon, providers: jaProviders },
        vi: { common: viCommon, providers: viProviders },
        th: { common: thCommon, providers: thProviders },
        ro: { common: roCommon, providers: roProviders },
        id: { common: idCommon, providers: idProviders }
      },
      ns: ['common', 'providers'],
      defaultNS: 'common',
      fallbackLng: 'en',
      supportedLngs: [
        'en',
        'nl',
        'de',
        'es',
        'fr',
        'pt',
        'hi',
        'it',
        'bn',
        'pl',
        'tr',
        'hu',
        'ru',
        'ja',
        'vi',
        'th',
        'ro',
        'id'
      ],
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
