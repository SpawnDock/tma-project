import { defaultLocale } from './config';
import type { Locale } from './types';

const COOKIE_NAME = 'NEXT_LOCALE';

const getLocale = async (): Promise<Locale> => {
  if (typeof document === 'undefined') {
    return defaultLocale;
  }

  const value = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`))
    ?.split('=')
    .slice(1)
    .join('=');

  return (value as Locale) || defaultLocale;
};

const setLocale = (locale?: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  const nextLocale = (locale as Locale) || defaultLocale;
  document.cookie = `${COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
};

export { getLocale, setLocale };
