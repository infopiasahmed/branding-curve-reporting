import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Branding Curve",
  description: "Agency daily reporting",
  applicationName: "Branding Curve",
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
