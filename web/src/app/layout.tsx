import type { Metadata } from "next";
import { Instrument_Sans, IBM_Plex_Mono, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Doqtri — living docs into mindmaps",
  description: "Living documents into executable mindmaps. Planned vs shipped on Stellar.",
  metadataBase: new URL("https://doqtri.app"),
  openGraph: {
    title: "Doqtri — living docs into mindmaps",
    description: "Planned vs shipped, verified on Stellar.",
    type: "website",
    siteName: "Doqtri",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doqtri — living docs into mindmaps",
    description: "Planned vs shipped, verified on Stellar.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrument.variable} ${outfit.variable} ${ibmMono.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
