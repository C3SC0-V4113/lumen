# 0007. Use a hybrid image optimization strategy

- Status: Accepted
- Date: 2026-11-08

## Context

Content is dynamic because it is edited in the CMS, pages are rendered with SSR, and the site runs
only on `workers.dev` (ADR 0001). URL transformations such as `/cdn-cgi/image/` require a zone, so
they are unavailable. There is no edge cache. The free Worker has about 10 ms of CPU time per
request, which rules out encoding images on the server with WASM. The Cloudflare adapter currently
uses `imageService: 'passthrough'`, with no image optimization.

## Decision

Use a hybrid approach. Optimize fixed design images, including the logo, hero artwork, and
illustrations, during the build with `imageService: 'compile'` from `@astrojs/cloudflare` and Astro's
`<Image>` or `<Picture>` components. Generate AVIF or WebP variants at multiple widths. This has no
runtime cost and will be applied in phase 4.

For CMS images, the base plan is to generate variants in the uploader when an image is uploaded.
The browser resizes the image with `createImageBitmap` and canvas to about three widths (480, 960,
and 1600) in AVIF or WebP. If the browser cannot encode AVIF, save only WebP. Preserve the original.
The server validates the user's role, origin, MIME type, size, actual bytes, and SHA-256 of every
variant, then stores dimensions in `media_asset`. Derive R2 keys from content.

Phase 7 must verify Cloudflare Images as an alternative. Its binding (`env.IMAGES`, configured as
`images` in `wrangler.jsonc`) transforms images from the Worker without requiring a zone. Start with
a spike on `workers.dev` to verify that the binding works there, check the current monthly free
quota for unique transformations against current documentation, measure latency and CPU use, and
identify the permissions needed by the CI token. If the spike succeeds, generate variants on the
server at upload time with the binding and save them in R2. Do not transform on each request, to
avoid spending transformation quota and Worker CPU. If the spike fails, keep the browser uploader
as the base plan. Record the result in this ADR: mark it superseded or add an amendment.

In either case, serve media from the Worker's `/media/<key>` route reading from R2. Do not use
public `r2.dev`, which has limits and is not intended for production. Since keys change with
content, responses use `Cache-Control: public, max-age=31536000, immutable`; without edge caching,
each browser downloads an image only once. Pages use `<picture>` with `srcset` and `sizes`, real
`width` and `height` to prevent CLS, `loading="lazy"` below the first screen, and
`fetchpriority="high"` on the primary image. SVG uploads remain restricted to admins, are sanitized,
and are served with `Content-Disposition` and CSP `sandbox`, following ADR 0004.

Do not use URL transformations, which require a zone; encode images in the Worker with WASM, which
exceeds the CPU limit; serve originals without variants, which harms LCP; or expose images through
public `r2.dev`, which has limits and is not for production.

## Consequences

- Runtime CPU cost for image transformation is zero, browser caching is strong, and no zone is
  required.
- The uploader is more complex.
- AVIF quality depends on the browser.
- Changing variant widths requires reprocessing existing images.
- Each served image counts as a Worker invocation.
