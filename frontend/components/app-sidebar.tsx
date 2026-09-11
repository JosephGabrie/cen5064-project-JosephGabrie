"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Calendar, LayoutGrid, User, LogOut, LogIn } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { signOutAction } from "@/app/auth/actions";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
]

export function AppSidebar() {
  const { user, loading, refreshAuth } = useAuth();

  // Get user initials for avatar
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  return (
    <Sidebar className="bg-[#f8fafc]">
      <SidebarHeader className="border-b border-sidebar-border py-4">
        <Link href="/" className="px-2 font-bold text-xl text-blue-600 hover:text-blue-700 transition-colors">
          MTV School
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 tracking-wider">
            NAVIGATION
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-2 space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={item.title === "Dashboard"}
                    className="text-[15px] font-medium text-slate-600 data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900 py-5"
                    render={<Link href={item.url} />}
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center gap-3 px-1">
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
              <div className="flex flex-col gap-1">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ) : user ? (
            <>
              <div className="flex items-center gap-3 px-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/90 font-semibold text-white shadow-sm">
                  {getInitials(user.firstName, user.email)}
                </div>
                <div className="flex flex-col leading-tight gap-0.5">
                  <span className="text-[15px] font-medium text-slate-900">
                    {user.firstName || "User"}
                  </span>
                  <span className="text-[13px] text-slate-500">{user.email}</span>
                </div>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void refreshAuth({ ensureSignedIn: true })}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-100"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

