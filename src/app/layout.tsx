import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const SITE_URL = "https://app.brandingcurve.agency"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Branding Curve",
  description: "Agency daily reporting",
  applicationName: "Branding Curve",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Branding Curve",
    description: "Agency daily reporting",
    url: SITE_URL,
    siteName: "Branding Curve",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image-v2.png",
        width: 1200,
        height: 630,
        alt: "Branding Curve",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Branding Curve",
    description: "Agency daily reporting",
    images: ["/og-image-v2.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Branding Curve",
  },
  manifest: "/manifest.webmanifest",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f4f1",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
