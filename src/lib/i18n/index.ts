import type { Locale } from './config';

type TranslationData = Record<string, any>;

const translations: Record<Locale, () => Promise<TranslationData>> = {
  en: () => import('./en.json').then(module => module.default),
  dv: () => import('./dv.json').then(module => module.default)
};

export async function getTranslations(locale: Locale): Promise<TranslationData> {
  return translations[locale]();
}

export function useTranslation(locale: Locale, translations: TranslationData | null) {
  const t = (key: string, params?: Record<string, string | number>): string => {
    if (!translations) {
      return key;
    }
    
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key "${key}" not found for locale "${locale}"`);
        return key;
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key "${key}" is not a string for locale "${locale}"`);
      return key;
    }
    
    // At this point, TypeScript knows value is a string
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };
  
  return { t };
}

export type TranslationFunction = ReturnType<typeof useTranslation>['t'];
