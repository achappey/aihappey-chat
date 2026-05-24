import enCommon from "./locales/en/en.json";
import enProviders from "./locales/en/providers.json";
import enMimeTypes from "./locales/en/mimeTypes.json";
import enRegional from "./locales/en/regional.json";

import nlCommon from "./locales/nl/nl.json";
import nlProviders from "./locales/nl/providers.json";
import nlMimeTypes from "./locales/nl/mimeTypes.json";
import nlRegional from "./locales/nl/regional.json";

import deCommon from "./locales/de/de.json";
import deProviders from "./locales/de/providers.json";
import deMimeTypes from "./locales/de/mimeTypes.json";

import esCommon from "./locales/es/es.json";
import esProviders from "./locales/es/providers.json";
import esMimeTypes from "./locales/es/mimeTypes.json";

import frCommon from "./locales/fr/fr.json";
import frProviders from "./locales/fr/providers.json";
import frMimeTypes from "./locales/fr/mimeTypes.json";

import ptCommon from "./locales/pt/pt.json";
import ptProviders from "./locales/pt/providers.json";
import ptMimeTypes from "./locales/pt/mimeTypes.json";

import hiCommon from "./locales/hi/hi.json";
import hiProviders from "./locales/hi/providers.json";
import hiMimeTypes from "./locales/hi/mimeTypes.json";

import itCommon from "./locales/it/it.json";
import itProviders from "./locales/it/providers.json";
import itMimeTypes from "./locales/it/mimeTypes.json";

import bnCommon from "./locales/bn/bn.json";
import bnProviders from "./locales/bn/providers.json";
import bnMimeTypes from "./locales/bn/mimeTypes.json";

import plCommon from "./locales/pl/pl.json";
import plProviders from "./locales/pl/providers.json";
import plMimeTypes from "./locales/pl/mimeTypes.json";

import trCommon from "./locales/tr/tr.json";
import trProviders from "./locales/tr/providers.json";
import trMimeTypes from "./locales/tr/mimeTypes.json";

import huCommon from "./locales/hu/hu.json";
import huProviders from "./locales/hu/providers.json";
import huMimeTypes from "./locales/hu/mimeTypes.json";

import ruCommon from "./locales/ru/ru.json";
import ruProviders from "./locales/ru/providers.json";
import ruMimeTypes from "./locales/ru/mimeTypes.json";

import jaCommon from "./locales/ja/ja.json";
import jaProviders from "./locales/ja/providers.json";
import jaMimeTypes from "./locales/ja/mimeTypes.json";

import viCommon from "./locales/vi/vi.json";
import viProviders from "./locales/vi/providers.json";
import viMimeTypes from "./locales/vi/mimeTypes.json";

import thCommon from "./locales/th/th.json";
import thProviders from "./locales/th/providers.json";
import thMimeTypes from "./locales/th/mimeTypes.json";

import roCommon from "./locales/ro/ro.json";
import roProviders from "./locales/ro/providers.json";
import roMimeTypes from "./locales/ro/mimeTypes.json";

import idCommon from "./locales/id/id.json";
import idProviders from "./locales/id/providers.json";
import idMimeTypes from "./locales/id/mimeTypes.json";

import daCommon from "./locales/da/da.json";
import daProviders from "./locales/da/providers.json";
import daMimeTypes from "./locales/da/mimeTypes.json";
import daRegional from "./locales/da/regional.json";

import svCommon from "./locales/sv/sv.json";
import svProviders from "./locales/sv/providers.json";
import svMimeTypes from "./locales/sv/mimeTypes.json";
import svRegional from "./locales/sv/regional.json";

export const resources = {
  en: { common: enCommon, providers: enProviders, mimeTypes: enMimeTypes, regional: enRegional },
  nl: { common: nlCommon, providers: nlProviders, mimeTypes: nlMimeTypes, regional: nlRegional },
  de: { common: deCommon, providers: deProviders, mimeTypes: deMimeTypes },
  es: { common: esCommon, providers: esProviders, mimeTypes: esMimeTypes },
  fr: { common: frCommon, providers: frProviders, mimeTypes: frMimeTypes },
  pt: { common: ptCommon, providers: ptProviders, mimeTypes: ptMimeTypes },
  hi: { common: hiCommon, providers: hiProviders, mimeTypes: hiMimeTypes },
  it: { common: itCommon, providers: itProviders, mimeTypes: itMimeTypes },
  bn: { common: bnCommon, providers: bnProviders, mimeTypes: bnMimeTypes },
  pl: { common: plCommon, providers: plProviders, mimeTypes: plMimeTypes },
  tr: { common: trCommon, providers: trProviders, mimeTypes: trMimeTypes },
  hu: { common: huCommon, providers: huProviders, mimeTypes: huMimeTypes },
  ru: { common: ruCommon, providers: ruProviders, mimeTypes: ruMimeTypes },
  ja: { common: jaCommon, providers: jaProviders, mimeTypes: jaMimeTypes },
  vi: { common: viCommon, providers: viProviders, mimeTypes: viMimeTypes },
  th: { common: thCommon, providers: thProviders, mimeTypes: thMimeTypes },
  ro: { common: roCommon, providers: roProviders, mimeTypes: roMimeTypes },
  id: { common: idCommon, providers: idProviders, mimeTypes: idMimeTypes },
  da: { common: daCommon, providers: daProviders, mimeTypes: daMimeTypes, regional: daRegional },
  sv: { common: svCommon, providers: svProviders, mimeTypes: svMimeTypes, regional: svRegional },
} as const;

export const supportedLngs = Object.keys(resources);
