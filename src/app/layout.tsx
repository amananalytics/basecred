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
  title: "BaseCred",
  verification: {
  other: {
    "talentapp:project_verification": "f60e665d119843bfcdc42d01f46221151deba7ef98dd4a8583edace22bac4dd174b8f30504122e463e06a6ce80855a5c4996d7697e516794e647de8c94bc089d",
  },
},
  description: "onchain credibility scoring for Farcaster and BaseApp",
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
      </body>
    </html>
  );
}
