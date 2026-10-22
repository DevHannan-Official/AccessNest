# AccessNest

**A free, plain-English accessibility check for the web pages that matter to your business.**

AccessNest helps small website owners spot common barriers and understand a practical next step. Automated checks are a first pass, not a compliance certificate or a replacement for people using assistive technology.

## Product stages

1. **Foundation (complete):** product brief, brand, responsive landing page, and clear scope.
2. **Single-page scan (complete):** safely inspect one public URL and report common, machine-detectable issues in returned HTML.
3. **Useful fixes (complete):** tailored illustrative HTML patterns with plain-language guidance and a copy action.
4. **Repeatable workflow (complete):** up to ten browser-local scans, same-page comparisons, a copyable summary, and JSON export.
5. **Quality and safety (complete):** bounded request bodies, safe public-address fetching, response limits, security headers, keyboard skip link, and privacy notes.
6. **Launch (deployed):** live at [accessnestai.vercel.app](https://accessnestai.vercel.app). Source is on [GitHub](https://github.com/DevHannan-Official/AccessNest), branch `main`. The existing Vercel project still needs its Git connection enabled in Vercel settings.

## Run locally

Requirements: Node.js 24 and pnpm 11.25.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

There are no environment variables or third-party credentials required for the current version. Fonts use the visitor’s system, so the page does not need a Google Fonts request.

## Verify a production build

```bash
pnpm typecheck
pnpm build
pnpm start
```

## Deploy to Vercel

### GitHub import (recommended)

The source is already pushed to [`DevHannan-Official/AccessNest`](https://github.com/DevHannan-Official/AccessNest) on `main`. To enable automatic deployments, open the existing AccessNest project in Vercel, go to **Settings → Git**, connect `DevHannan-Official/AccessNest`, and keep `main` as the production branch. GitHub's deployment integration may ask you to authorize Vercel for this repository.

If you need to clone the project locally:

```bash
git clone https://github.com/DevHannan-Official/AccessNest.git
cd AccessNest
```

Keep the detected **Next.js** framework, Node.js 24, and `pnpm install --frozen-lockfile` / `pnpm build` settings. This version does not need environment variables.

Vercel’s [Git deployment flow](https://vercel.com/docs/git) automatically builds and deploys commits after you connect the repository.

### Deploy with the Vercel CLI

```bash
npm install --global vercel
vercel login
cd "/path/to/AI SaaS Sprint"
vercel
```

Review the preview URL. When you want it public on the production domain assigned by Vercel:

```bash
vercel --prod
```

See Vercel’s [CLI deployment guide](https://vercel.com/docs/projects/deploy-from-cli). No custom `vercel.json` is needed; Next.js is auto-detected.

## Current scan scope and privacy

The scan runs 17 checks on returned HTML: document language and title, zoom restrictions, image alternatives, form and control names, vague or unnamed links, duplicate IDs, broken ARIA ID references, heading order, the main landmark, iframe titles, data-table header cues, positive `tabindex`, hidden interactive controls, and video caption-track presence. It does not run JavaScript, render the page, measure color contrast, test keyboard operation, submit forms, or judge whether descriptions and workflows make sense to people. Some checks need a person to confirm context; a flagged video caption track, for example, does not prove caption quality. Up to ten scan reports (including page URLs) are stored in the current browser only; fetched page HTML is not saved. Clear local history from the scan panel. See the in-product [privacy notice](/privacy).

The API accepts only public HTTP(S) pages on standard ports, checks DNS results and redirect targets, follows at most two redirects, caps fetched HTML at 2 MB and request JSON at 4 KB, times out, and applies a best-effort per-instance rate limit. This is baseline protection for a small launch; it is not a globally coordinated abuse-control service. Automated evaluation is only a starting point. See [W3C guidance on selecting accessibility evaluation tools](https://www.w3.org/WAI/test-evaluate/tools/selecting/).
