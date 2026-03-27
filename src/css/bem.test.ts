import { describe, expect, it } from 'vitest';

import { bem } from './bem';

describe('bem', () => {
  it('returns the bare block or element class when no modifiers are passed', () => {
    const [block, elem] = bem('button');

    expect(block()).toBe('button');
    expect(elem('icon')).toBe('button__icon');
  });

  it('applies string, array, and object modifiers to blocks', () => {
    const [block] = bem('button');

    expect(
      block(
        'primary',
        ['rounded', { loading: true, disabled: false }],
        { compact: true },
      ),
    ).toBe(
      'button button--primary button--rounded button--loading button--compact',
    );
  });

  it('applies modifiers to elements using the element namespace', () => {
    const [, elem] = bem('button');

    expect(elem('icon', 'large', { active: true, hidden: false })).toBe(
      'button__icon button__icon--large button__icon--active',
    );
  });
});
