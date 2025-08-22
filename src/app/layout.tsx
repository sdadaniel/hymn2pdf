import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "찬미가",
  description: "찬미가",
  icons: {
    icon: '/android-icon-72x72.png',
    shortcut: '/android-icon-72x72.png',
    apple: '/android-icon-72x72.png',
  },
  openGraph: {
    title: "찬미가",
    description: "찬미가 다운로드 서비스",
    images: [
      {
        url: '/og-img.png',
        width: 1200,
        height: 630,
        alt: '찬미가 다운로드',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "찬미가",
    description: "찬미가 다운로드 서비스",
    images: ['/og-img.png'],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        
        {children}
        <Analytics/>
      </body>
    </html>
  );
}
