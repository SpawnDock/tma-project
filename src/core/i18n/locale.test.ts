import { afterEach, describe, expect, it } from 'vitest';

import { defaultLocale } from './config';
import { getLocale, setLocale } from './locale';

const installDocument = (cookie = '') => {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { cookie },
    writable: true,
  });
};

describe('locale cookie helpers', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'document');
  });

  it('falls back to the default locale on the server', async () => {
    expect(await getLocale()).toBe(defaultLocale);
  });

  it('reads the locale from document.cookie when present', async () => {
    installDocument('theme=dark; NEXT_LOCALE=ru; path=/');

    expect(await getLocale()).toBe('ru');
  });

  it('writes the locale cookie with the expected attributes', () => {
    installDocument();

    setLocale('ru');

    expect(globalThis.document.cookie).toBe(
      'NEXT_LOCALE=ru; path=/; max-age=31536000; samesite=lax',
    );
  });

  it('falls back to the default locale when writing an empty locale', () => {
    installDocument();

    setLocale('');

    expect(globalThis.document.cookie).toContain(`NEXT_LOCALE=${defaultLocale}`);
  });
});
