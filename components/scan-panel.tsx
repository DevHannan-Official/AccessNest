"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { ScanFinding, ScanResult } from "@/lib/scan-types";

type ScanResponse = { result?: ScanResult; error?: string };
const HISTORY_KEY = "accessnest.scan-history.v1";
const HISTORY_LIMIT = 10;

function isScanResult(value: unknown): value is ScanResult {
  if (!value || typeof value !== "object") return false;
  const scan = value as Partial<ScanResult>;
  let safeUrl = false;
  try {
    const parsedUrl = new URL(scan.url ?? "");
    safeUrl = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    safeUrl = false;
  }
  return safeUrl && typeof scan.url === "string" && typeof scan.host === "string" &&
    (typeof scan.pageTitle === "string" || scan.pageTitle === null) && typeof scan.scannedAt === "string" &&
    (scan.checksRun === undefined || typeof scan.checksRun === "number") && Array.isArray(scan.manualChecks) && scan.manualChecks.every((item) => typeof item === "string") &&
    Array.isArray(scan.findings) && scan.findings.every((item) => item && typeof item.id === "string" &&
      typeof item.title === "string" && typeof item.whyItMatters === "string" && typeof item.fix === "string" &&
      typeof item.wcag === "string" && typeof item.count === "number" && item.example &&
      typeof item.example.before === "string" && typeof item.example.after === "string" &&
      typeof item.example.note === "string");
}

function comparableUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
}

function compareFindingCounts(current: ScanResult, previous: ScanResult) {
  const currentCounts = new Map(current.findings.map((finding) => [finding.id, finding.count]));
  const previousCounts = new Map(previous.findings.map((finding) => [finding.id, finding.count]));
  const ids = new Set([...currentCounts.keys(), ...previousCounts.keys()]);
  const changes = { cleared: 0, newIssues: 0, reduced: 0, increased: 0, unchanged: 0 };
  for (const id of ids) {
    const before = previousCounts.get(id) ?? 0;
    const after = currentCounts.get(id) ?? 0;
    if (before > 0 && after === 0) changes.cleared += 1;
    else if (before === 0 && after > 0) changes.newIssues += 1;
    else if (after < before) changes.reduced += 1;
    else if (after > before) changes.increased += 1;
    else changes.unchanged += 1;
  }
  return changes;
}

export function ScanPanel() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setHistory(parsed.filter(isScanResult).slice(0, HISTORY_LIMIT));
      }
    } catch {
      // Ignore unavailable storage or invalid saved data; scans continue to work in memory.
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
    } catch {
      // Storage may be disabled or full; the current scan remains available in this session.
    }
  }, [history, historyLoaded]);

  const previousScan = result ? history
    .filter((scan) => comparableUrl(scan.url) === comparableUrl(result.url) && Date.parse(scan.scannedAt) < Date.parse(result.scannedAt))
    .sort((a, b) => Date.parse(b.scannedAt) - Date.parse(a.scannedAt))[0] ?? null : null;

  async function submitScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runScan(url.trim());
  }

  async function runScan(targetUrl: string) {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const payload = await response.json() as ScanResponse;
      if (!response.ok || !payload.result) throw new Error(payload.error || "The scan could not be completed. Try another public page.");
      const nextResult = payload.result;
      setResult(nextResult);
      setHistory((previous) => [nextResult, ...previous.filter((scan) => scan.scannedAt !== nextResult.scannedAt)].slice(0, HISTORY_LIMIT));
      window.setTimeout(() => {
        resultHeading.current?.focus();
        resultHeading.current?.scrollIntoView({ block: "start" });
      }, 0);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "The scan could not be completed. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="scan-section" id="scan" aria-labelledby="scan-heading">
      <div className="scan-intro">
        <span className="section-eyebrow">YOUR FIRST CHECK</span>
        <h2 id="scan-heading">Start with one page.</h2>
        <p>Enter a public page address to run 17 checks on its returned HTML for common accessibility barriers. No account; scan history stays in this browser.</p>
      </div>

      <form className="scan-form" onSubmit={submitScan}>
        <label htmlFor="scan-url">Public page URL</label>
        <div className="scan-input-row">
          <input
            id="scan-url"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://yourbusiness.com/contact"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
            maxLength={2048}
            aria-describedby="scan-help"
          />
          <button className="button button-primary scan-button" type="submit" disabled={isLoading}>
            {isLoading ? <><span className="spinner" aria-hidden="true" /> Checking…</> : <>Check this page <span aria-hidden="true">→</span></>}
          </button>
        </div>
        <p className="scan-help" id="scan-help">Only public web pages are supported. We fetch the page HTML and discard it after the check.</p>
      </form>

      {history.length > 0 && <div className="scan-history" aria-label="Recent scans">
        <div className="scan-history-heading">
          <div><strong>Recent scans</strong><p>Page URLs and reports stay in this browser. The scanned page HTML is never saved.</p></div>
          <button type="button" className="text-button" onClick={() => { setHistory([]); setResult(null); }}>Clear history</button>
        </div>
        <ul>{history.map((scan) => <li key={`${scan.scannedAt}-${scan.url}`}>
          <button type="button" className={`history-item ${result?.scannedAt === scan.scannedAt ? "history-item-active" : ""}`} onClick={() => { setResult(scan); setUrl(scan.url); }} aria-pressed={result?.scannedAt === scan.scannedAt}>
            <span className="history-item-copy"><strong>{scan.pageTitle || scan.host}</strong><small>{scan.host} · {new Date(scan.scannedAt).toLocaleString()}</small></span>
            <span className={`history-count ${scan.findings.length ? "" : "history-count-clear"}`}>{scan.findings.length} {scan.findings.length === 1 ? "finding" : "findings"}</span>
          </button>
        </li>)}</ul>
      </div>}

      {error && <p className="scan-error" role="alert">{error}</p>}

      {result && <div className="scan-result" aria-live="polite">
        <div className="result-topline">
          <div>
            <span className="section-eyebrow">QUICK HTML CHECK · {new Date(result.scannedAt).toLocaleString()}</span>
            <h2 ref={resultHeading} tabIndex={-1}>{result.pageTitle || result.host}</h2>
            <a href={result.url} target="_blank" rel="noreferrer" className="result-url">{result.host} <span aria-hidden="true">↗</span></a>
          </div>
          <div className={`result-count ${result.findings.length ? "count-attention" : "count-clear"}`}>
            <strong>{result.findings.length}</strong><span>{result.findings.length === 1 ? "finding" : "findings"}<br />to review</span>
          </div>
        </div>

        <div className="report-actions">
          <button type="button" className="report-action-primary" onClick={() => { setUrl(result.url); void runScan(result.url); }} disabled={isLoading}>
            {isLoading ? "Scanning…" : "Scan again"}
          </button>
          <ReportActions result={result} />
        </div>

        {previousScan && <Comparison current={result} previous={previousScan} />}

        <div className="check-coverage" aria-label="Automated scan coverage">
          <strong>{result.checksRun ?? 6} automated checks</strong>
          <span>{result.checksRun ? "HTML structure · names and labels · links · images · ARIA references · keyboard hints · media cues" : "This report was created by an earlier version of the scanner."}</span>
        </div>

        {result.findings.length ? <div className="scan-findings">
          {result.findings.map((finding) => <FindingCard finding={finding} key={finding.id} />)}
        </div> : <div className="no-findings"><span aria-hidden="true">✓</span><div><strong>No common issues detected in this HTML check.</strong><p>This is only a first pass; it does not mean the page is fully accessible.</p></div></div>}

        <div className="manual-review">
          <div><span className="section-eyebrow">A PERSON STILL NEEDS TO CHECK</span><h3>{result.manualChecks.length} checks this scan can’t decide for you</h3></div>
          <ul>{result.manualChecks.map((check) => <li key={check}><span aria-hidden="true">↗</span>{check}</li>)}</ul>
        </div>
        <details className="scan-limits">
          <summary>What this check does—and doesn’t—cover</summary>
          <p>AccessNest checks the page’s returned HTML for a small set of common, machine-detectable issues. It may miss content added after the page loads, and it cannot assess visual contrast, whether alt text is accurate, keyboard usability, or a person’s experience with assistive technology. Use the results as a starting point, not a compliance determination.</p>
        </details>
      </div>}
    </section>
  );
}

function Comparison({ current, previous }: { current: ScanResult; previous: ScanResult }) {
  const changes = compareFindingCounts(current, previous);
  const summary = [
    changes.cleared ? `${changes.cleared} ${changes.cleared === 1 ? "issue type" : "issue types"} no longer flagged` : "",
    changes.newIssues ? `${changes.newIssues} new ${changes.newIssues === 1 ? "issue type" : "issue types"}` : "",
    changes.reduced ? `${changes.reduced} issue ${changes.reduced === 1 ? "type has" : "types have"} fewer occurrences` : "",
    changes.increased ? `${changes.increased} issue ${changes.increased === 1 ? "type has" : "types have"} more occurrences` : "",
    changes.unchanged ? `${changes.unchanged} unchanged` : "",
  ].filter(Boolean);

  return <section className="comparison-card" aria-labelledby="comparison-heading" aria-live="polite">
    <div className="comparison-heading"><div><span className="section-eyebrow">SAME PAGE · TWO SCANS</span><h3 id="comparison-heading">Change since your previous scan</h3></div>
      <span className="comparison-dates">{new Date(previous.scannedAt).toLocaleDateString()} → {new Date(current.scannedAt).toLocaleDateString()}</span>
    </div>
    <p>{summary.length ? summary.join(" · ") : "No difference in the checks this scan could detect."}</p>
    <small>Compares detected check categories and their occurrence counts; it is not a full accessibility assessment.</small>
  </section>;
}

function ReportActions({ result }: { result: ScanResult }) {
  const [copyStatus, setCopyStatus] = useState("");

  async function copySummary() {
    const lines = [
      `AccessNest quick HTML check: ${result.pageTitle || result.host}`,
      `Page: ${result.url}`,
      `Scanned: ${new Date(result.scannedAt).toLocaleString()}`,
      `Detected ${result.findings.length} ${result.findings.length === 1 ? "finding" : "findings"}:`,
      ...result.findings.map((finding) => `- ${finding.title} (${finding.count} ${finding.count === 1 ? "item" : "items"})`),
      "Automated checks are a starting point, not a compliance determination.",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyStatus("Summary copied.");
    } catch {
      setCopyStatus("Clipboard unavailable. Try Download JSON instead.");
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify({ product: "AccessNest", exportedAt: new Date().toISOString(), report: result }, null, 2)], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `accessnest-report-${result.host.replace(/[^a-z0-9.-]/gi, "-")}-${result.scannedAt.slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
  }

  return <>
    <button type="button" onClick={() => void copySummary()}>Copy summary</button>
    <button type="button" onClick={downloadJson}>Download JSON</button>
    <span aria-live="polite">{copyStatus}</span>
  </>;
}

function FindingCard({ finding }: { finding: ScanFinding }) {
  return <article className="scan-finding">
    <div className="scan-finding-icon" aria-hidden="true">!</div>
    <div className="scan-finding-copy">
      <div className="scan-finding-meta"><span>{finding.severity === "needs-attention" ? "NEEDS ATTENTION" : "REVIEW"}</span><span>WCAG {finding.wcag}</span></div>
      <h3>{finding.title} <span className="occurrence-count">· {finding.count} {finding.count === 1 ? "item" : "items"}</span></h3>
      <p>{finding.whyItMatters}</p>
      <div className="fix-callout"><strong>A practical next step</strong><p>{finding.fix}</p></div>
      <details className="finding-example">
        <summary>See example HTML</summary>
        <p className="example-note">Illustrative pattern only. Adapt it to your content and codebase; this scan doesn’t identify the exact source location.</p>
        <div className="example-pair">
          <div><span>Before</span><pre><code>{finding.example.before}</code></pre></div>
          <div><span>One possible change</span><pre><code>{finding.example.after}</code></pre></div>
        </div>
        <p className="example-advice">{finding.example.note}</p>
        <CopyExample text={finding.example.after} />
      </details>
    </div>
  </article>;
}

function CopyExample({ text }: { text: string }) {
  const [status, setStatus] = useState("");

  async function copyExample() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Example copied.");
    } catch {
      setStatus("Clipboard unavailable. Select the example above and copy it.");
    }
  }

  return <div className="copy-row">
    <button type="button" onClick={copyExample}>Copy example</button>
    <span aria-live="polite">{status}</span>
  </div>;
}
