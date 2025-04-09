import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { initializeCache } from "@/services/mock-api-handler"

// Initialize the mock cache on the client side
if (typeof window !== "undefined") {
  initializeCache()
}

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart[Ai]sle - Make Healthier Grocery Choices",
  description: "AI-powered grocery shopping assistant for health-conscious consumers",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'