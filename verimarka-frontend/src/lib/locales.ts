export const LANGUAGE_STORAGE_KEY = "verimarka:language";

export const SUPPORTED_LOCALES = ["ko", "en", "ja", "zh-CN"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "ko";

export function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function normalizeLocale(value: string | undefined): SupportedLocale | null {
  if (!value) return null;
  if (value === "zh" || value.toLowerCase() === "zh-cn") return "zh-CN";
  if (isSupportedLocale(value)) return value;
  return null;
}

export function getPreferredLocale(): SupportedLocale {
  if (typeof window !== "undefined") {
    const stored = normalizeLocale(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || undefined);
    if (stored) return stored;
  }

  if (typeof navigator !== "undefined") {
    const browserLanguage = navigator.language;
    if (browserLanguage.startsWith("en")) return "en";
    if (browserLanguage.startsWith("ja")) return "ja";
    if (browserLanguage.startsWith("zh")) return "zh-CN";
  }

  return DEFAULT_LOCALE;
}

export function getLocaleFromPathname(pathname: string): SupportedLocale | null {
  const [firstSegment = ""] = pathname.replace(/^\/+/, "").split("/");
  return normalizeLocale(decodeURIComponent(firstSegment));
}

export function stripLocaleFromPathname(pathname: string) {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname || "/";

  const [, firstSegment = ""] = pathname.match(/^\/+([^/]+)/) || [];
  const strippedPath = pathname.slice(`/${firstSegment}`.length);
  return strippedPath || "/";
}

export function withLocalePath(pathname: string, locale: SupportedLocale) {
  const pathWithoutLocale = stripLocaleFromPathname(pathname);
  if (pathWithoutLocale === "/") return `/${locale}`;
  return `/${locale}${pathWithoutLocale}`;
}
