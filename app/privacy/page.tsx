import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | AccessNest",
  description: "What AccessNest processes when you run an accessibility check.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <main className="privacy-page">
    <Link className="brand" href="/">
      <Image src="/accessnest-mark.svg" alt="" width={38} height={38} />
      <span>accessnest<span className="brand-period">.</span></span>
    </Link>
    <Link className="privacy-back" href="/">← Back to AccessNest</Link>
    <h1>Privacy, in plain language.</h1>
    <p className="privacy-lede">AccessNest checks one public web page when you ask it to. Here is what happens to the information involved.</p>

    <section><h2>What you send</h2><p>When you start a scan, your page URL is sent to the AccessNest scan endpoint. The endpoint requests that public page from its server, checks the returned HTML, and sends a report back to your browser. The remote website may receive the request from the AccessNest server and process it according to its own policies.</p></section>
    <section><h2>What AccessNest keeps</h2><p>The app does not save fetched page HTML or keep scan reports on its server. A short-lived, in-memory rate limit uses the request IP address to limit repeated scans; this is best-effort and may reset when server instances restart. The hosting provider may process request metadata under its own policies.</p></section>
    <section><h2>Scan history on your device</h2><p>Your browser can keep up to ten scan reports in local storage so you can revisit and compare them. Reports include the page URL and findings. They stay in that browser profile until you clear the history in the scan panel or clear the browser’s site data. Anyone with access to the same browser profile may be able to view them.</p></section>
    <section><h2>Copying and downloading</h2><p>If you choose Copy summary or Download JSON, your browser copies or downloads the report at your request. You control where you paste or share that information.</p></section>
    <section><h2>Analytics</h2><p>AccessNest uses Vercel Web Analytics to understand site traffic. It can collect page views, referrers, approximate location, and device or browser details. Vercel says these data points are anonymous and aggregated, and that it does not use third-party cookies. A short-lived hash may identify a visitor session for up to 24 hours. See <a href="https://vercel.com/docs/analytics/privacy-policy">Vercel’s Web Analytics privacy information</a> for details.</p></section>
    <section><h2>What this tool does not do</h2><p>AccessNest does not require an account, request a payment method, or load third-party fonts. It checks returned HTML and does not render JavaScript, measure visual color contrast, or test a page with a keyboard or screen reader. Its automated checks are limited and do not determine whether a page complies with accessibility law or standards.</p></section>
    <p className="privacy-note">This notice describes the current app behavior. Hosting-provider practices and applicable privacy requirements may also apply.</p>
  </main>;
}
