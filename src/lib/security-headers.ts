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

export function getContentSecurityPolicyHeader(hostname: string, existingPolicy?: string) {
  const directives = (existingPolicy ?? '')
    .split(';')
    .map((directive) => directive.trim())
    .filter((directive) => directive && !directive.startsWith('frame-ancestors '));
  directives.push("frame-ancestors 'none'");
  if (!loopbackHosts.has(hostname)) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

export function applySecurityHeaders(headers: Headers, protocol: string) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    if (name !== 'Strict-Transport-Security' || protocol === 'https:') {
      headers.set(name, value);
    }
  }
}
