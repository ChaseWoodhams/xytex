import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Xytex | America's Longest-Running Sperm Bank Since 1975",
  description:
    "Xytex is America's most trusted sperm bank with 50 years of experience. Browse 200+ identity-disclosed donors with 569 genetic tests. LGBTQ+ friendly, at-home delivery available.",
  keywords: [
    "sperm bank",
    "sperm donor",
    "fertility",
    "LGBTQ family building",
    "single mother by choice",
    "donor sperm",
    "at-home insemination",
    "identity disclosure",
  ],
  openGraph: {
    title: "Xytex | America's Longest-Running Sperm Bank Since 1975",
    description:
      "50 years of helping families. Browse 200+ identity-disclosed donors with comprehensive genetic testing.",
    type: "website",
    locale: "en_US",
    siteName: "Xytex",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          {/* Skip to Content Link - Accessibility */}
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          <ConditionalLayout>
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
