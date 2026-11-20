import { describe, expect, it } from 'vitest';

import { getHomePresentation } from '../../src/features/home/shared/presentation';

describe('Home presentation status', () => {
  it('does not surface fallback or stale status for members outside the rendered preview', () => {
    const team = Array.from({ length: 23 }, (_, index) => ({
      fallback: index === 22,
      stale: index === 21,
    }));

    const presentation = getHomePresentation({ fallback: false, stale: false }, team);

    expect(presentation.teamPreview).toHaveLength(4);
    expect(presentation.fallback).toBe(false);
    expect(presentation.stale).toBe(false);
  });

  it('surfaces fallback and stale status when a preview member needs it', () => {
    const team = [{ fallback: true, stale: true }];

    expect(getHomePresentation({ fallback: false, stale: false }, team)).toMatchObject({
      fallback: true,
      stale: true,
    });
  });
});
