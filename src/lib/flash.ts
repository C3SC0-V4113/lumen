export type FlashType = 'success' | 'error' | 'info';

export interface FlashMessage {
  type: FlashType;
  title: string;
  description?: string;
}

export const FLASH_COOKIE_NAME = 'lumen-flash';
const FLASH_TYPES: readonly FlashType[] = ['success', 'error', 'info'];

/** The cookie is client-readable and must never contain sensitive information. */
export function flashCookieValue(message: FlashMessage) {
  // Return the raw value for context.cookies.set, which applies encodeURIComponent when writing.
  return JSON.stringify(message);
}

export function flashCookieOptions(secure: boolean) {
  // This is a host-only cookie with Path=/; writers must use these options so deletion reaches it.
  return {
    path: '/',
    maxAge: 60,
    sameSite: 'lax',
    httpOnly: false,
    secure,
  } as const;
}

function decodeFlashMessage(value: string): FlashMessage | null {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    if (typeof parsed !== 'object' || parsed === null) return null;

    const { type, title, description } = parsed as Record<string, unknown>;
    if (!FLASH_TYPES.includes(type as FlashType)) return null;
    if (typeof title !== 'string' || title.trim().length === 0 || title.length > 120) return null;
    if (description !== undefined && typeof description !== 'string') return null;
    if (typeof description === 'string' && description.length > 300) return null;

    return description === undefined
      ? { type: type as FlashType, title }
      : { type: type as FlashType, title, description };
  } catch {
    return null;
  }
}

export function clearFlashCookie(secure: boolean) {
  return `${FLASH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function readFlashCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${FLASH_COOKIE_NAME}=`));

  if (!cookie) return null;
  const value = cookie.slice(`${FLASH_COOKIE_NAME}=`.length);
  return value ? decodeFlashMessage(value) : null;
}

export function readFlashCookieFromDocument() {
  return readFlashCookie(document.cookie);
}
