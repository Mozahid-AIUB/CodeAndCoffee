import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({ variable: "--font-latin", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Manus Office", template: "%s · Manus Office" },
  description: "Office tea/coffee and daily meal ordering",
  applicationName: "Manus Office",
  appleWebApp: { capable: true, title: "Manus", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#15100c" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get("theme")?.value;
  const dataTheme = theme === "light" || theme === "dark" ? theme : undefined;
  return (
    <html lang="en" className={inter.variable} data-theme={dataTheme} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
