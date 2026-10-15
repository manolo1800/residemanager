import esCommon from "./locales/es/common.json";
import enCommon from "./locales/en/common.json";
import frCommon from "./locales/fr/common.json";
import ptCommon from "./locales/pt/common.json";

export const SUPPORTED_LOCALES = ["es", "en", "fr", "pt"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "es";

export const translations = {
  es: { common: esCommon },
  en: { common: enCommon },
  fr: { common: frCommon },
  pt: { common: ptCommon },
} as const;
