# AccessNest — product brief

## The problem

Small business owners often know their website should be accessible but do not know where to start. Standards and audit tools can overwhelm non-specialists, while a superficial pass/fail score does not tell them what to change.

## Audience

Owners of small service-business and creator websites who maintain their own site or work with one freelancer. Initial focus: a single important page such as a contact, booking, or product page.

## Promise

**Find the accessibility problems on your web page—and understand what to fix.**

## Product principles

- Free to use; no billing, card, or forced signup in the first version.
- Plain language before standards codes; include the standard reference as supporting detail.
- Report concrete, reproducible findings; separate automated findings from manual checks.
- Do not market automated results as legal compliance or a complete accessibility audit.
- Keep the product narrow: scan, explain, fix, rescan.
- Minimize data retention; never store scanned page content longer than needed for a requested report.

## First useful outcome

Someone enters a public page URL and receives a short prioritized list of detectable barriers, why each matters, and a practical next step. The first version is limited to one page and one scan at a time.

## Stage 2 implementation

The first scan fetches only public HTTP(S) pages on standard ports, applies DNS-level public-address checks, follows no more than two redirects, caps HTML at 2 MB, times out, and returns the result without persistence. It checks document language/title, zoom restrictions, image alternatives, form/control names, link names and purpose, duplicate IDs, ARIA references, heading order, main landmarks, iframe titles, table-header cues, positive `tabindex`, hidden controls, and video-caption-track presence. It also presents manual review steps for zoom/reflow, keyboard use, screen-reader experience, meaningful content, form errors, and media. The scanner does not render JavaScript or measure visual contrast.

This is a static-HTML check. It does not render JavaScript, test CSS, submit a form, or certify WCAG/ADA/EAA conformance.

## Stage 3 implementation

Each automated finding now includes a relevant before/after HTML pattern, guidance for adapting it to the page, and a copy button. Examples are generic teaching patterns, not edits extracted from the scanned site. The scan still discards fetched HTML and does not claim to identify source-code locations.

## Stage 4 implementation

The browser keeps up to ten successful scan reports in local storage so a person can revisit scans, rescan the same URL, compare issue categories and occurrence counts with the previous scan, copy a plain-text summary, or download a JSON report. The scanned HTML is not included in saved reports. History is local to that browser and can be cleared from the scan panel; there is no server-side account or public report link.

## Stage 5 implementation

The scan endpoint caps incoming JSON at 4 KB, validates JSON content type, and retains the public-address, redirect, timeout, and 2 MB response limits. It returns `no-store` responses and applies a best-effort in-memory rate limit keyed by the Vercel client-IP header. The app adds defensive browser security headers, visible keyboard focus, and a skip link. Local scan history includes page URLs and can be cleared by the user; fetched HTML is never persisted.

The in-memory limit is not a globally coordinated abuse-control system across serverless instances. For a larger public launch, monitor abuse and add a shared rate-limit service if needed. Review the deployed Vercel project settings and privacy notice before inviting broad public use.

## Risks to validate

- Whether small site owners will use a scanner and apply fixes without an expert.
- Whether plain-language explanations are meaningfully better than established free tools.
- False positives, inaccessible dynamic content, and pages that automated tools cannot evaluate.
- Safe fetching of arbitrary URLs, rate limits, and abuse prevention.

## Evidence and guardrails

W3C maintains a broad directory of evaluation tools and advises that automated evaluation is only part of accessibility evaluation. AccessNest should therefore focus on useful triage and explain its limits clearly; it must not claim to certify conformance. See [W3C guidance](https://www.w3.org/WAI/test-evaluate/tools/selecting/) and the [W3C evaluation tools list](https://www.w3.org/WAI/test-evaluate/tools/list/).
