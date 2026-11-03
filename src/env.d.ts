/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL: URL;
  readonly SITE_ENV: 'local' | 'staging' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
