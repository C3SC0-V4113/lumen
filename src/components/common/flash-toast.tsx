import { useEffect } from 'react';

import { Toaster, toast } from '@/components/ui/toast';
import { t, type Locale } from '@/i18n';
import { clearFlashCookie, FLASH_COOKIE_NAME, readFlashCookieFromDocument } from '@/lib/flash';

export function FlashToast({ lang }: { lang: Locale }) {
  useEffect(() => {
    const hasFlashCookie = document.cookie
      .split(';')
      .some((part) => part.trim().startsWith(`${FLASH_COOKIE_NAME}=`));
    if (!hasFlashCookie) return;

    const flash = readFlashCookieFromDocument();
    document.cookie = clearFlashCookie(location.protocol === 'https:');
    if (flash) {
      if (flash.type === 'error') {
        toast.add({ ...flash, priority: 'high', timeout: 0 });
      } else {
        toast.add(flash);
      }
    }
  }, []);

  return <Toaster closeLabel={t(lang, 'toast.close')} viewportLabel={t(lang, 'toast.region')} />;
}
