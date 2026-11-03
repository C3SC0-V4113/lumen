import { SITE_ENV } from 'astro:env/server';
import { defineMiddleware } from 'astro:middleware';

import { getHttpsRedirectLocation, hardenResponse } from './lib/security-headers';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url } = context;
  const redirectLocation = getHttpsRedirectLocation(url);
  if (redirectLocation) {
    return hardenResponse(
      new Response(null, {
        status: 308,
        headers: { Location: redirectLocation },
      }),
      url,
      SITE_ENV
    );
  }

  try {
    return hardenResponse(await next(), url, SITE_ENV);
  } catch (error) {
    console.error(
      '[middleware] Request failed:',
      error instanceof Error ? error.name : 'Unknown error'
    );
    const errorPage = await context.rewrite('/500');
    return hardenResponse(
      new Response(errorPage.body, {
        status: 500,
        statusText: errorPage.statusText,
        headers: errorPage.headers,
      }),
      url,
      SITE_ENV
    );
  }
});
