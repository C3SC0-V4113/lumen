export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
} as const;

export const staticSecurityHeaders = {
  ...securityHeaders,
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'",
} as const;

const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

export function shouldRedirectToHttps(protocol: string, hostname: string) {
  return protocol === 'http:' && !loopbackHosts.has(hostname);
}

export function getHttpsRedirectLocation(url: URL) {
  if (!shouldRedirectToHttps(url.protocol, url.hostname)) return undefined;
  const redirectUrl = new URL(url);
  redirectUrl.protocol = 'https:';
  return redirectUrl.href;
}

export function getRobotsTag(siteEnv: string) {
  return siteEnv === 'production' ? undefined : 'noindex, nofollow';
}

export function hasNullBodyStatus(status: number) {
  return [101, 204, 205, 304].includes(status);
}

export function getContentSecurityPolicyHeader(hostname: string, existingPolicy?: string) {
  const directives = (existingPolicy ?? '')
    .split(';')
    .map((directive) => directive.trim())
    .filter((directive) => directive && !directive.startsWith('frame-ancestors '));
  directives.push("frame-ancestors 'none'");
  if (!loopbackHosts.has(hostname)) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

export function hardenResponse(response: Response, url: URL, siteEnv: string) {
  const headers = new Headers(response.headers);
  applySecurityHeaders(headers, url.protocol);
  const robotsTag = getRobotsTag(siteEnv);
  if (robotsTag) headers.set('X-Robots-Tag', robotsTag);
  headers.set(
    'Content-Security-Policy',
    getContentSecurityPolicyHeader(
      url.hostname,
      headers.get('Content-Security-Policy') ?? undefined
    )
  );
  return new Response(hasNullBodyStatus(response.status) ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function renderErrorPageSafely(
  locals: { errorPageFailed?: boolean },
  renderErrorPage: () => Promise<Response>,
  url: URL,
  siteEnv: string
) {
  if (locals.errorPageFailed) {
    return hardenResponse(new Response('Internal Server Error', { status: 500 }), url, siteEnv);
  }

  locals.errorPageFailed = true;
  try {
    const errorPage = await renderErrorPage();
    return hardenResponse(
      new Response(errorPage.body, {
        status: 500,
        statusText: errorPage.statusText,
        headers: errorPage.headers,
      }),
      url,
      siteEnv
    );
  } catch {
    return hardenResponse(new Response('Internal Server Error', { status: 500 }), url, siteEnv);
  }
}

export function applySecurityHeaders(headers: Headers, protocol: string) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    if (name !== 'Strict-Transport-Security' || protocol === 'https:') {
      headers.set(name, value);
    }
  }
}
