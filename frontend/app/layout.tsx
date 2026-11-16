import { Geist_Mono, Roboto } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AuthProvider } from "@/contexts/AuthContext"
import { AuthGuard } from "@/components/auth-guard"
import { cn } from "@/lib/utils"

const roboto = Roboto({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", roboto.variable)}
    >
      <body suppressHydrationWarning>
        <AuthProvider>
          <AuthGuard>
            <ThemeProvider>
              <SidebarProvider>
                <AppSidebar />
                <main className="flex min-h-screen w-full flex-col bg-[#f8fbfa] text-[#071e22] dark:bg-[#071e22] dark:text-[#f8fbfa]">
                  <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-[#679289]/30 bg-white/90 px-4 backdrop-blur-xs sm:px-6 dark:border-[#679289]/20 dark:bg-[#071e22]/90">
                    <SidebarTrigger
                      aria-label="Toggle navigation sidebar"
                      className="text-[#071e22] hover:bg-[#679289]/15 focus-visible:ring-2 focus-visible:ring-[#1d7874] dark:text-[#f8fbfa]"
                    />
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1d7874] dark:text-[#f4c095]">
                      <span>MTV School Portal</span>
                    </div>
                  </header>
                  <div className="flex-1 w-full bg-[#f8fbfa] text-[#071e22] dark:bg-[#071e22] dark:text-[#f8fbfa]">
                    {children}
                  </div>
                </main>
              </SidebarProvider>
            </ThemeProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
