import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://accessnestai.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Free Website Accessibility Checker | AccessNest",
    template: "%s | AccessNest",
  },
  description:
    "Check a web page for common accessibility barriers for free. AccessNest explains what its automated checks find and what still needs a human review.",
  applicationName: "AccessNest",
  category: "technology",
  keywords: [
    "free website accessibility checker",
    "web accessibility checker",
    "accessibility audit tool",
    "website accessibility issues",
    "WCAG first check",
  ],
  alternates: { canonical: "/" },
  icons: { icon: "/accessnest-mark.svg" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "AccessNest",
    title: "Free Website Accessibility Checker | AccessNest",
    description:
      "Check a web page for common accessibility barriers for free, with plain-English guidance on what to review next.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Free Website Accessibility Checker | AccessNest",
    description:
      "Check a web page for common accessibility barriers for free, with plain-English guidance on what to review next.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = { themeColor: "#16312b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AccessNest",
    url: siteUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    description:
      "A free website accessibility checker that identifies common barriers in a page's returned HTML and explains practical next steps.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
