import { describe, expect, it } from 'vitest';

import {
  clearFlashCookie,
  FLASH_COOKIE_NAME,
  flashCookieOptions,
  flashCookieValue,
  readFlashCookie,
} from '@/lib/flash';

function asCookieHeader(value: string) {
  return `${FLASH_COOKIE_NAME}=${encodeURIComponent(value)}`;
}

describe('flash helpers', () => {
  it('round-trips a message through the cookie value', () => {
    const value = flashCookieValue({ type: 'success', title: 'Listo', description: 'Guardado' });
    expect(readFlashCookie(asCookieHeader(value))).toEqual({
      type: 'success',
      title: 'Listo',
      description: 'Guardado',
    });
  });

  it.each(['success', 'error', 'info'] as const)('accepts the %s type', (type) => {
    expect(readFlashCookie(asCookieHeader(JSON.stringify({ type, title: 'Aviso' })))).toEqual({
      type,
      title: 'Aviso',
    });
  });

  it('rejects missing, malformed, unsupported, and incorrectly typed fields', () => {
    expect(readFlashCookie(null)).toBeNull();
    expect(readFlashCookie('other=value')).toBeNull();
    expect(readFlashCookie(`${FLASH_COOKIE_NAME}=%`)).toBeNull();
    for (const message of [
      { type: 'unknown', title: 'Aviso' },
      { type: 'info', title: {} },
      { type: 'info', title: 'Aviso', description: 4 },
      { type: 'info', title: '' },
    ]) {
      expect(readFlashCookie(asCookieHeader(JSON.stringify(message)))).toBeNull();
    }
  });

  it('accepts the title and description limits and rejects longer values', () => {
    const valid = { type: 'info', title: 't'.repeat(120), description: 'd'.repeat(300) };
    expect(readFlashCookie(asCookieHeader(JSON.stringify(valid)))).toEqual(valid);
    expect(
      readFlashCookie(asCookieHeader(JSON.stringify({ ...valid, title: `${valid.title}t` })))
    ).toBeNull();
    expect(
      readFlashCookie(
        asCookieHeader(JSON.stringify({ ...valid, description: `${valid.description}d` }))
      )
    ).toBeNull();
  });

  it('sets client-readable cookie attributes with a 60 second lifetime', () => {
    expect(flashCookieOptions()).toEqual({
      path: '/',
      maxAge: 60,
      sameSite: 'lax',
      httpOnly: false,
    });
  });

  it('clears the cookie with a caller supplied Secure attribute', () => {
    expect(clearFlashCookie(false)).toBe('lumen-flash=; Path=/; Max-Age=0; SameSite=Lax');
    expect(clearFlashCookie(true)).toBe('lumen-flash=; Path=/; Max-Age=0; SameSite=Lax; Secure');
  });
});
