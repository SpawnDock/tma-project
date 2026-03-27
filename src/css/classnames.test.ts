import { describe, expect, it } from 'vitest';

import { classNames, isRecord, mergeClassNames } from './classnames';

describe('isRecord', () => {
  it('returns true only for plain objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('value')).toBe(false);
  });
});

describe('classNames', () => {
  it('joins strings, arrays, and truthy object keys', () => {
    expect(
      classNames(
        'root',
        ['nested', ['deep']],
        { active: true, hidden: false },
        undefined,
        null,
        0,
      ),
    ).toBe('root nested deep active');
  });

  it('ignores empty strings and unsupported values', () => {
    expect(classNames('', false, true, 1, NaN, undefined, null, [])).toBe('');
  });
});

describe('mergeClassNames', () => {
  it('merges partial records key by key', () => {
    expect(
      mergeClassNames(
        {
          root: 'base',
          icon: ['icon', { active: true, hidden: false }],
        },
        {
          root: { extra: true, muted: false },
          icon: 'icon-secondary',
          label: 'text',
        },
      ),
    ).toEqual({
      root: 'base extra',
      icon: 'icon active icon-secondary',
      label: 'text',
    });
  });

  it('ignores non-record partials', () => {
    expect(mergeClassNames({ root: 'base' }, null, ['skip'])).toEqual({
      root: 'base',
    });
  });
});
