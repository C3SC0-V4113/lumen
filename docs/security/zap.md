# OWASP ZAP baseline triage

CI scans the compiled Worker through local Wrangler with the public routes only. The scan is passive;
it does not authenticate or exercise the future CMS.

Rules marked `FAIL` protect headers that should be present on every Worker response: clickjacking
protection, MIME sniffing protection, CSP, and Permissions Policy. Fix any regression in the shared
header source and its static asset counterpart.

HSTS is deliberately not a ZAP failure on the local HTTP origin. Browsers ignore HSTS received over
HTTP, so the unit suite verifies the exact HSTS value and that the Worker adds it only to HTTPS
responses. The staging `workers.dev` smoke test checks HSTS after deployment.

Static asset headers are exercised by Playwright against `/_astro/*` and public files. ZAP's
baseline starts from `/` and may not discover every hashed asset; its scope is not a substitute for
those E2E assertions.
