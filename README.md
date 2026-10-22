# AccessNest

**A free, plain-English accessibility check for the web pages that matter to your business.**

AccessNest helps small website owners spot common barriers and understand a practical next step. Automated checks are a first pass, not a compliance certificate or a replacement for people using assistive technology.

## Product stages

1. **Foundation (complete):** product brief, brand, responsive landing page, and clear scope.
2. **Single-page scan (complete):** safely inspect one public URL and report common, machine-detectable issues in returned HTML.
3. **Useful fixes (complete):** tailored illustrative HTML patterns with plain-language guidance and a copy action.
4. **Repeatable workflow (complete):** up to ten browser-local scans, same-page comparisons, a copyable summary, and JSON export.
5. **Quality and safety (complete):** bounded request bodies, safe public-address fetching, response limits, security headers, keyboard skip link, and privacy notes.
6. **Launch (deployed):** live at [accessnestai.vercel.app](https://accessnestai.vercel.app). GitHub source connection remains pending a dedicated AccessNest repository.

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

1. Create an empty GitHub repository (private is a sensible default), then from this folder run the commands below. Replace the URL with the repository URL GitHub gives you:

```bash
git init -b main
git add .
git commit -m "Prepare AccessNest for deployment"
git remote add origin https://github.com/YOUR_ACCOUNT/accessnest.git
git push -u origin main
```

This working folder is not connected to GitHub yet.
2. In Vercel, choose **Add New → Project**, then import that repository.
3. Keep the detected **Next.js** framework and default build settings. The included `pnpm-lock.yaml` selects pnpm; `package.json` and `.nvmrc` pin Node.js 24 (Vercel's current default).
4. Add no environment variables for this version, then deploy. Vercel creates a preview/production URL.

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
