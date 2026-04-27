import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Kare Bear Auto Shop",
    template: "%s | Kare Bear Auto Shop",
  },
  description:
    "Request auto service appointments online with Kare Bear Auto Shop. Reliable service, simple scheduling, and professional care.",
  keywords: [
    "Kare Bear Auto Shop",
    "auto repair",
    "car service",
    "oil change",
    "brake inspection",
    "vehicle diagnostics",
    "appointment booking",
  ],
  authors: [{ name: "Kare Bear Auto Shop" }],
  creator: "Kare Bear Auto Shop",
  openGraph: {
    title: "Kare Bear Auto Shop",
    description:
      "Reliable auto care with simple online appointment scheduling.",
    url: "https://karebearauto.com",
    siteName: "Kare Bear Auto Shop",
    type: "website",
  },
  icons: {
    icon: "/kare-bear-logo.png",
    apple: "/kare-bear-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}