import { Inter } from "next/font/google"
import { Navigation } from "@/components/navigation"
import { TranslationProvider } from "@/contexts/translation-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ClientAuthWrapper } from "@/components/auth/ClientAuthWrapper"
import { Toaster } from "sonner"
import { DebugInitializer } from "@/components/debug/DebugInitializer"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ShoppingBird - Smart Shopping Assistant",
  description: "A smart shopping assistant for everyday people to record their purchases",
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-background">
        <AuthProvider>
          <TranslationProvider>
            <ClientAuthWrapper>
              <Navigation />
              <main className="px-4 py-8 sm:px-6 lg:px-8">
                {children}
              </main>
            </ClientAuthWrapper>
            <Toaster 
              position="top-right" 
              richColors 
              closeButton 
              duration={4000}
            />
            <DebugInitializer />
          </TranslationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
