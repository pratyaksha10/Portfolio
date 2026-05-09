import type { Metadata, Viewport } from "next";
import localFont from 'next/font/local';
import Script from "next/script";
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
  metadataBase: new URL("https://pratyaksha-11.vercel.app"),
  title: {
    default: "Pratyaksha | Creative Frontend Engineer & Interactive Developer",
    template: "%s | Pratyaksha"
  },
  description: "Senior Frontend Engineer specializing in React, Three.js, and immersive web experiences. Explore my portfolio featuring creative coding and high-performance web applications.",
  keywords: ["Pratyaksha", "Frontend Engineer", "Creative Developer", "React Developer", "Three.js", "WebGL", "Interactive Web", "Software Engineer India", "UI/UX Developer"],
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
    title: "Pratyaksha | Creative Frontend Engineer",
    description: "Frontend developer by profession, a creative at heart. Specializing in high-performance React and Three.js experiences.",
    url: "https://pratyaksha-11.vercel.app",
    siteName: "Pratyaksha Portfolio",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Pratyaksha Portfolio Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pratyaksha | Creative Frontend Engineer",
    description: "Explore the intersection of engineering and creativity. Frontend experiences built with React and Three.js.",
    images: ["/opengraph-image.png"],
    creator: "@pratycreates",
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
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-WQVBC5EPNB`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-WQVBC5EPNB', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Pratyaksha",
              "url": "https://pratyaksha-11.vercel.app",
              "jobTitle": "Frontend Engineer",
              "sameAs": [
                "https://github.com/pratyaksha10",
                "https://instagram.com/pratycreates",
                "https://www.behance.net/pratyaksharma1"
              ],
              "description": "Creative Frontend Engineer specializing in React, Three.js, and interactive web experiences."
            })
          }}
        />
        {children}
        <FluidCursorTrailWrapper />
        <ExperienceCursor />
      </body>
    </html>
  );
}
