import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { LoadingScreen } from "@/components/loading-screen"
import { Toaster } from "@/components/ui/sonner"
import { ClientProviders } from "@/components/clientProviders"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CS DocShare - Computer Science Document Sharing System",
  description: "A secure document sharing platform for the Computer Science Department",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LoadingScreen />
        {/* <div className="min-h-screen bg-gray-50">
          <Header />
          <main>{children}</main>
        </div> */}
        <ClientProviders>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>{children}</main>
          </div>
        </ClientProviders>
        <Toaster />
      </body>
    </html>
  )
}
