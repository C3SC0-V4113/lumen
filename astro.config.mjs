// @ts-check

import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: { prefixDefaultLocale: false },
  },
  adapter: cloudflare({ sessionKVBindingName: 'SESSION_KV', imageService: 'passthrough' }),
  security: {
    checkOrigin: true,
    csp: {
      algorithm: 'SHA-256',
      scriptDirective: {
        resources: ["'self'"],
        hashes: ['sha256-Az1ObD1cVxP1Z6jWBXHWKWoHXWBTKf6a4jWsIBWz6Rc='],
      },
      styleDirective: {
        hashes: [
          {
            hash: 'sha256-kLmvWqfziFavKtqHqRsb90f006UAK2Dmd0It5Iz2KFA=',
            kind: 'element',
          },
          {
            hash: 'sha256-5F9GrKBhqyaNOeYUtJnXqF6zx18El+yIK5QJdjPDOus=',
            kind: 'attribute',
          },
        ],
        resources: [
          { resource: "'self'", kind: 'element' },
          { resource: "'unsafe-hashes'", kind: 'attribute' },
        ],
      },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ],
    },
  },
  markdown: { syntaxHighlight: false },
  env: {
    schema: {
      SITE_URL: envField.string({ context: 'server', access: 'public', url: true }),
      SITE_ENV: envField.enum({
        context: 'server',
        access: 'public',
        values: ['local', 'staging', 'production'],
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],
});
