import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import bn from "./locales/bn.json";
import zh from "./locales/zh.json";
import ko from "./locales/ko.json";
import hi from "./locales/hi.json";
import ja from "./locales/ja.json";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";

const SUPPORTED_LOCALES = ["en", "es", "bn", "zh", "ko", "hi", "ja"] as const;
const savedLng = storage.getItem(STORAGE_KEYS.LOCALE);
const initialLng: string =
  savedLng && SUPPORTED_LOCALES.includes(savedLng as (typeof SUPPORTED_LOCALES)[number])
    ? savedLng
    : "en";

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: "en",
  resources: {
    en: { translation: en },
    es: { translation: es },
    bn: { translation: bn },
    zh: { translation: zh },
    ko: { translation: ko },
    hi: { translation: hi },
    ja: { translation: ja },
  },
  interpolation: { escapeValue: false },
});

export function persistLocale(locale: string): void {
  storage.setItem(STORAGE_KEYS.LOCALE, locale);
}

export default i18n;
