import { Geist, Geist_Mono, Roboto } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { cn } from "@/lib/utils";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";

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
      <body>
        <AuthKitProvider>
          <ThemeProvider>
            <SidebarProvider>
              <AppSidebar />
              <main className="w-full">
                <SidebarTrigger />
                <div className="min-h-screen w-full bg-white bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:16px_16px] text-slate-900 dark:text-slate-100">
                  {children}
                </div>
              </main>
            </SidebarProvider>
          </ThemeProvider>
        </AuthKitProvider>
      </body>
    </html>
  )
}
