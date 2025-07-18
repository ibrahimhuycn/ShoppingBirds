export const defaultLocale = 'en';
export const supportedLocales = ['en', 'dv'] as const;

export type Locale = (typeof supportedLocales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  dv: 'ދިވެހި'
};

export function isValidLocale(locale: string): locale is Locale {
  return supportedLocales.includes(locale as Locale);
}

export function getLocaleFromUrl(pathname: string): Locale {
  const segments = pathname.split('/');
  const maybeLocale = segments[1];
  
  if (isValidLocale(maybeLocale)) {
    return maybeLocale;
  }
  
  return defaultLocale;
}
