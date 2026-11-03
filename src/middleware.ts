import { defineMiddleware } from 'astro:middleware';

import {
  applySecurityHeaders,
  getContentSecurityPolicyHeader,
  getHttpsRedirectLocation,
  getRobotsTag,
} from './lib/security-headers';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url } = context;
  const harden = (response: Response) => {
    applySecurityHeaders(response.headers, url.protocol);
    const robotsTag = getRobotsTag(import.meta.env.SITE_ENV);
    if (robotsTag) response.headers.set('X-Robots-Tag', robotsTag);
    response.headers.set(
      'Content-Security-Policy',
      getContentSecurityPolicyHeader(
        url.hostname,
        response.headers.get('Content-Security-Policy') ?? undefined
      )
    );
    return response;
  };
  const redirectLocation = getHttpsRedirectLocation(url);
  if (redirectLocation) {
    return harden(
      new Response(null, {
        status: 308,
        headers: { Location: redirectLocation },
      })
    );
  }

  try {
    return harden(await next());
  } catch {
    return harden(new Response('Internal Server Error', { status: 500 }));
  }
});
