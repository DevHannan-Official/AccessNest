import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AccessNest — Make your website easier for everyone",
  description: "Find common accessibility barriers on your web page and understand what to fix next. Free, practical guidance for small website owners.",
  icons: { icon: "/accessnest-mark.svg" },
};

export const viewport: Viewport = { themeColor: "#16312b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
