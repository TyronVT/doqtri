import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Doqtri — living docs into mindmaps",
  description:
    "Living documents into executable mindmaps. Planned vs shipped on Stellar.",
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
      <body className={`${plex.variable} ${plexMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
