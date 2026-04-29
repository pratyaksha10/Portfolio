import type { Metadata, Viewport } from "next";
import localFont from 'next/font/local';
import "./globals.css";
import FluidCursorTrailWrapper from "./components/common/FluidCursorTrailWrapper";
import ExperienceCursor from "./components/common/ExperienceCursor";

const soriaFont = localFont({
  src: "../public/soria-font.ttf",
  variable: "--font-soria",
});

const vercettiFont = localFont({
  src: "../public/Vercetti-Regular.woff",
  variable: "--font-vercetti",
});

export const metadata: Metadata = {
  title: "Pratyaksha",
  description: "A frontend developer by profession, a creative at heart.",
  keywords: "Pratyaksha, Frontend Engineer, React Developer, Three.js, Creative Developer, Web Development, Angular, JavaScript, TypeScript, Portfolio",
  authors: [{ name: "Pratyaksha" }],
  creator: "Pratyaksha",
  publisher: "Pratyaksha",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Pratyaksha ",
    description: "Frontend engineer.",
    url: "https://pratyaksha-11.vercel.app",
    siteName: "Pratyaksha's Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pratyaksha ",
    description: "Frontend engineer.",
  },
  verification: {
    google: "GVYEGhBRIqS-LajgP6FcvLW7P1wT7_xxyGwqXd4cCKE",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overscroll-y-none">
      <body
        className={`${soriaFont.variable} ${vercettiFont.variable} font-sans antialiased`}
      >
        {children}
        <FluidCursorTrailWrapper />
        <ExperienceCursor />
      </body>

    </html>
  );
}
