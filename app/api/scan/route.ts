import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from "node:dns";
import { isIP } from "node:net";
import ipaddr from "ipaddr.js";
import { Agent, request } from "undici";
import { scanHtml } from "@/lib/accessibility-scan";
import type { ScanResult } from "@/lib/scan-types";

export const runtime = "nodejs";
export const maxDuration = 15;

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_REQUEST_BYTES = 4 * 1024;
const MAX_URL_LENGTH = 2048;
const MAX_REDIRECTS = 2;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 5;
const recentScans = new Map<string, number[]>();

type ScanErrorCode = "INVALID_URL" | "PRIVATE_ADDRESS" | "NOT_HTML" | "TOO_LARGE" | "FETCH_FAILED";

class ScanError extends Error {
  constructor(public code: ScanErrorCode, message: string) {
    super(message);
  }
}

function isPublicAddress(address: string) {
  try {
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
}

function validateUrl(value: string) {
  if (value.length > MAX_URL_LENGTH) throw new ScanError("INVALID_URL", "That address is too long. Enter a public page URL.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ScanError("INVALID_URL", "Enter a complete public URL, such as https://example.com/contact.");
  }

  if (!(["http:", "https:"].includes(url.protocol)) || url.username || url.password) {
    throw new ScanError("INVALID_URL", "Use a public http or https page URL without sign-in details.");
  }
  if ((url.protocol === "http:" && url.port && url.port !== "80") || (url.protocol === "https:" && url.port && url.port !== "443")) {
    throw new ScanError("INVALID_URL", "For safety, scans support standard web ports only.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.endsWith(".test")) {
    throw new ScanError("PRIVATE_ADDRESS", "That address is not a public website. Try a public page instead.");
  }
  if (isIP(hostname) && !isPublicAddress(hostname)) {
    throw new ScanError("PRIVATE_ADDRESS", "That address is not a public website. Try a public page instead.");
  }
  url.hash = "";
  return url;
}

function createSafeAgent() {
  const lookup = (
    hostname: string,
    _options: LookupOptions,
    callback: (error: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
  ) => {
    dnsLookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
      if (error) return callback(error, "", 0);
      if (!addresses.length || addresses.some((entry) => !isPublicAddress(entry.address))) {
        const blocked = Object.assign(new Error("The target did not resolve to a public address."), { code: "EACCES" });
        return callback(blocked, "", 0);
      }
      if (_options.all) callback(null, addresses);
      else callback(null, addresses[0].address, addresses[0].family);
    });
  };

  return new Agent({ connect: { lookup }, connections: 1, pipelining: 0, maxResponseSize: MAX_BODY_BYTES });
}

async function readLimitedBody(body: AsyncIterable<Uint8Array>) {
  const chunks: Uint8Array[] = [];
  let length = 0;
  for await (const chunk of body) {
    length += chunk.byteLength;
    if (length > MAX_BODY_BYTES) throw new ScanError("TOO_LARGE", "This page is larger than the 2 MB scan limit.");
    chunks.push(chunk);
  }
  const joined = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(joined);
}

async function readScanRequest(requestObject: Request) {
  const contentType = requestObject.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new ScanError("INVALID_URL", "Send the page address as JSON and try again.");
  }
  const declaredLength = Number(requestObject.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) throw new ScanError("INVALID_URL", "That request is too large. Send only one page URL.");
  if (!requestObject.body) throw new ScanError("INVALID_URL", "Enter a public page URL to scan.");

  const reader = requestObject.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new ScanError("INVALID_URL", "That request is too large. Send only one page URL.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new ScanError("INVALID_URL", "That request was not valid JSON. Try again.");
  }
}

async function fetchPublicHtml(startUrl: URL) {
  let url = startUrl;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 8_500);
  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      validateUrl(url.toString());
      const agent = createSafeAgent();
      try {
        const response = await request(url, {
          dispatcher: agent,
          method: "GET",
          maxRedirections: 0,
          headersTimeout: 5_000,
          bodyTimeout: 5_000,
          signal: abortController.signal,
          headers: {
            accept: "text/html,application/xhtml+xml;q=0.9",
            "user-agent": "AccessNest-Accessibility-Check/1.0 (+https://accessnest.app)",
          },
        });

        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          const locationHeader = response.headers.location;
          const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
          response.body.destroy();
          if (!location || redirects === MAX_REDIRECTS) throw new ScanError("FETCH_FAILED", "This page redirected too many times to scan safely.");
          url = validateUrl(new URL(location, url).toString());
          continue;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.body.destroy();
          throw new ScanError("FETCH_FAILED", "We could not open this page. Check that it is public and try again.");
        }

        const contentType = response.headers["content-type"];
        const contentTypeValue = Array.isArray(contentType) ? contentType.join(" ") : contentType ?? "";
        if (!/^(text\/html|application\/xhtml\+xml)(?:\s*;|$)/i.test(contentTypeValue)) {
          response.body.destroy();
          throw new ScanError("NOT_HTML", "That address did not return a web page we can scan. Try a public HTML page.");
        }

        const declaredLength = Number(response.headers["content-length"] ?? 0);
        if (declaredLength > MAX_BODY_BYTES) {
          response.body.destroy();
          throw new ScanError("TOO_LARGE", "This page is larger than the 2 MB scan limit.");
        }
        const html = await readLimitedBody(response.body);
        return { html, finalUrl: url };
      } finally {
        await agent.close().catch(() => undefined);
      }
    }
    throw new ScanError("FETCH_FAILED", "We could not open this page. Try again.");
  } catch (error) {
    if (error instanceof ScanError) throw error;
    if (abortController.signal.aborted) throw new ScanError("FETCH_FAILED", "The page took too long to respond. Try again later.");
    if (error instanceof Error && "code" in error && error.code === "EACCES") {
      throw new ScanError("PRIVATE_ADDRESS", "That address did not resolve to a public website.");
    }
    throw new ScanError("FETCH_FAILED", "We could not open this page. Check that it is public and try again.");
  } finally {
    clearTimeout(timeout);
  }
}

function isRateLimited(clientId: string) {
  const now = Date.now();
  if (recentScans.size > 10_000) {
    for (const [key, timestamps] of recentScans) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_WINDOW_MS)) recentScans.delete(key);
    }
  }
  const recent = (recentScans.get(clientId) ?? []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (!recentScans.has(clientId) && recentScans.size >= 10_000) {
    const oldestClient = recentScans.keys().next().value;
    if (oldestClient) recentScans.delete(oldestClient);
  }
  recentScans.set(clientId, recent);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  return false;
}

export async function POST(requestObject: Request) {
  const forwardedIp = requestObject.headers.get("x-vercel-forwarded-for") ?? requestObject.headers.get("x-forwarded-for");
  const candidateIp = forwardedIp?.split(",")[0]?.trim() ?? "";
  const clientId = isIP(candidateIp) ? candidateIp : "unknown";
  if (isRateLimited(clientId)) {
    return Response.json({ error: "Please wait a minute before running another scan." }, { status: 429, headers: { "cache-control": "no-store" } });
  }

  try {
    const payload = await readScanRequest(requestObject);
    const value = typeof payload === "object" && payload !== null && "url" in payload ? payload.url : null;
    if (typeof value !== "string" || !value.trim()) throw new ScanError("INVALID_URL", "Enter a public page URL to scan.");

    const startUrl = validateUrl(value.trim());
    const { html, finalUrl } = await fetchPublicHtml(startUrl);
    const { findings, pageTitle, checksRun } = scanHtml(html);
    const result: ScanResult = {
      url: finalUrl.toString(),
      host: finalUrl.hostname,
      pageTitle,
      scannedAt: new Date().toISOString(),
      findings,
      checksRun,
      manualChecks: [
        "Check text and controls at 200% zoom, narrow screen widths, and high contrast. Confirm content remains readable without horizontal scrolling.",
        "Use only the keyboard to reach and operate every control. Check the focus order, visible focus indicator, dialogs, and that focus is never trapped.",
        "Use a screen reader to review page landmarks, headings, form labels and errors, link purpose, and announcements after interactions.",
        "Confirm alternative text describes each informative image in context, and that headings, instructions, and link text make sense to a person.",
        "Submit forms with missing or invalid data. Check that errors are clearly identified, explained, and easy to correct.",
        "Review captions and transcripts for accuracy, check that motion can be reduced, and ensure no content flashes rapidly.",
      ],
    };
    return Response.json({ result }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof ScanError ? error.message : "We could not complete that scan. Please try again.";
    return Response.json({ error: message }, { status: 400, headers: { "cache-control": "no-store" } });
  }
}
