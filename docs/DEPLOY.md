# Deploy

Node 18+, no dependencies.

```bash
node src/build.mjs                                                                # dist/ (production URLs, indexable)
node src/build.mjs --preview --out dist-preview --base /northernlights-redesign/  # GitHub Pages preview (noindex)
```

The preview publishes with `private/publish.sh` (not in the public repo): preview build, a fail-closed scan of both
public trees (keys, credentials, other names), push of `main` (source) and `gh-pages` (preview), wait for Pages,
then `tools/smoke-preview.mjs` on the live URL.

For a production launch: build without `--preview`, point the domain at the host, reconnect the contact and vendor
forms to a form handler, and keep each store's menu embed script (`src/content/site.mjs`).
