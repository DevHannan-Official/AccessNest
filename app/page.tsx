import Image from "next/image";
import Link from "next/link";
import { ScanPanel } from "@/components/scan-panel";

const findings = [
  { tag: "HIGH PRIORITY", title: "Give this image a text alternative", detail: "A screen reader may have no way to describe what this image shows.", icon: "▧", tint: "peach" },
  { tag: "WORTH A LOOK", title: "Check the text contrast", detail: "Some visitors may struggle to read this text against its background.", icon: "◐", tint: "yellow" },
  { tag: "MANUAL CHECK", title: "Try the page using only a keyboard", detail: "A person needs to reach and use every control without a mouse.", icon: "↹", tint: "mint" },
];

export default function Home() {
  return (
    <main>
      <a className="skip-link" href="#scan">Skip to the page checker</a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="AccessNest home">
          <Image src="/accessnest-mark.svg" alt="" width={38} height={38} priority />
          <span>accessnest<span className="brand-period">.</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#what-you-get">What you get</a>
          <a className="nav-cta" href="#how-it-works">Explore the approach <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A clearer first step toward an accessible web</div>
          <h1 id="hero-title">Make your website<br />easier for <em>everyone.</em></h1>
          <p className="hero-lede">Find common accessibility barriers on your page—and get a plain-English explanation of what to fix next.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#scan">Check a page free <span aria-hidden="true">→</span></a>
            <span className="free-note"><span aria-hidden="true">✳</span> Free to use. No account needed.</span>
          </div>
          <div className="trust-row"><span className="trust-icon" aria-hidden="true">✦</span><span>Built for small teams who want a practical place to start.</span></div>
        </div>

        <div className="preview-wrap" aria-hidden="true">
          <div className="preview-orbit orbit-one" /><div className="preview-orbit orbit-two" />
          <div className="report-card">
            <div className="report-topline"><div className="report-brand"><Image src="/accessnest-mark.svg" alt="" width={25} height={25} /><span>accessnest</span></div><span className="sample-badge">SAMPLE REPORT</span></div>
            <div className="report-heading"><div><span className="report-kicker">A FIRST LOOK</span><h2>Your page, made clearer.</h2></div><div className="score-ring"><strong>3</strong><span>things to<br />review</span></div></div>
            <div className="report-url"><span className="url-lock" aria-hidden="true">↗</span> yourbusiness.com/contact</div>
            <div className="finding-list">
              {findings.map((finding, index) => <article className="finding" key={finding.title}>
                <div className={`finding-icon ${finding.tint}`} aria-hidden="true">{finding.icon}</div>
                <div className="finding-copy"><span className="finding-tag">{finding.tag}</span><h3>{finding.title}</h3><p>{finding.detail}</p></div>
                <span className="finding-index">0{index + 1}</span>
              </article>)}
            </div>
            <div className="report-foot"><span><span className="foot-check">✓</span> Clear next steps</span><span>Example only · no scan run</span></div>
          </div>
          <div className="float-note note-top"><span className="note-spark">✳</span><span><b>Small steps matter</b><small>Start with one page</small></span></div>
          <div className="float-note note-bottom"><span className="note-people">◎</span><span><b>Designed for humans</b><small>Not just a score</small></span></div>
        </div>
      </section>

      <ScanPanel />

      <section className="belief-strip" aria-label="Our approach">
        <span>GOOD ACCESSIBILITY HELPS REAL PEOPLE</span>
        <div><span aria-hidden="true">◉</span> More people can use your site</div>
        <div><span aria-hidden="true">⌘</span> Clear guidance, not jargon</div>
        <div><span aria-hidden="true">♡</span> Start small and improve</div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-intro"><span className="section-eyebrow">A USEFUL PLACE TO BEGIN</span><h2>From “I should check”<br />to “I know what to do.”</h2><p>Accessibility can feel like a big subject. AccessNest makes the first step easier to understand and easier to act on.</p></div>
        <div className="steps-grid">
          <article className="step-card"><span className="step-number">01</span><div className="step-symbol symbol-one" aria-hidden="true">↗</div><h3>Choose one page</h3><p>Start with the page people rely on most—like your contact, booking, or product page.</p></article>
          <article className="step-card"><span className="step-number">02</span><div className="step-symbol symbol-two" aria-hidden="true">⌕</div><h3>See what stands out</h3><p>Get a short list of common barriers, with the important details explained in everyday language.</p></article>
          <article className="step-card"><span className="step-number">03</span><div className="step-symbol symbol-three" aria-hidden="true">↻</div><h3>Make a change, then review</h3><p>Take one improvement at a time. Some things still need a real person to check by hand.</p></article>
        </div>
      </section>

      <section className="promise-section" id="what-you-get">
        <div className="promise-mark"><Image src="/accessnest-mark.svg" alt="" width={55} height={55} /></div>
        <div><span className="section-eyebrow">THE ACCESSNEST PROMISE</span><h2>Useful guidance.<br /><em>No false guarantees.</em></h2><p>Automated checks can catch some issues, but they cannot tell the whole story. We’ll show what a scan can find, what needs a human check, and where to go next.</p><a className="text-link" href="https://www.w3.org/WAI/test-evaluate/tools/selecting/" target="_blank" rel="noreferrer">How accessibility evaluation tools work <span aria-hidden="true">↗</span></a></div>
        <div className="promise-aside"><span className="aside-leaf" aria-hidden="true">✳</span><p>“Accessible design is better design for all.”</p><span>Start small. Keep going.</span></div>
      </section>

      <section className="closing-cta"><span className="closing-star" aria-hidden="true">✳</span><div><span className="section-eyebrow">A BETTER WEB STARTS SOMEWHERE</span><h2>Let’s make your next step a little clearer.</h2><p>Start with one page, learn what can be improved, then make a change at a time.</p></div><a className="button button-light" href="#scan">Check a page free <span aria-hidden="true">→</span></a></section>

      <footer className="site-footer"><Link className="brand footer-brand" href="/" aria-label="AccessNest home"><Image src="/accessnest-mark.svg" alt="" width={31} height={31} /><span>accessnest<span className="brand-period">.</span></span></Link><span>Small steps toward a web that works for more people.</span><Link className="footer-privacy" href="/privacy">Privacy</Link><span>© 2026 AccessNest</span></footer>
    </main>
  );
}
