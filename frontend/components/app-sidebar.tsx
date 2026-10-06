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
} from "@/components/ui/sidebar";
import { Calendar, LayoutGrid, User as UserIcon, LogOut, Home, Megaphone, MessageSquare, ClipboardList, HelpCircle, GraduationCap, CheckCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutGrid,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: UserIcon,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  const isClassRoute = pathname.startsWith("/class/");
  const classId = isClassRoute ? pathname.split("/")[2] : null;

  const classNavItems = classId ? [
    { title: "Home", url: `/class/${classId}`, icon: Home },
    { title: "Announcements", url: `/class/${classId}/announcements`, icon: Megaphone },
    { title: "Discussions", url: `/class/${classId}/discussions`, icon: MessageSquare },
    { title: "Assignments", url: `/class/${classId}/assignments`, icon: ClipboardList },
    { title: "Quizzes", url: `/class/${classId}/quizzes`, icon: HelpCircle },
    { title: "Grades", url: `/class/${classId}/grades`, icon: GraduationCap },
  ] : [];

  if (isClassRoute && user?.role === "teacher") {
    classNavItems.push({ title: "Attendance", url: `/class/${classId}/attendance`, icon: CheckCircle });
  }

  return (
    <Sidebar className="bg-[#f8fafc]">
      <SidebarHeader className="border-b border-sidebar-border py-4">
        <Link
          href="/"
          className="px-2 font-bold text-xl text-blue-600 hover:text-blue-700 transition-colors"
        >
          MTV School
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {isClassRoute && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 tracking-wider">
              CLASS NAVIGATION
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="mt-2 space-y-1">
                {classNavItems.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        className="text-[15px] font-medium text-slate-600 data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900 py-5"
                        render={<Link href={item.url} />}
                      >
                        <item.icon className="mr-2 h-5 w-5" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 tracking-wider">
            {isClassRoute ? "MAIN NAVIGATION" : "NAVIGATION"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-2 space-y-1">
              {navItems.map((item) => {
                const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className="text-[15px] font-medium text-slate-600 data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900 py-5"
                      render={<Link href={item.url} />}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/90 font-semibold text-white shadow-sm">
              U
            </div>
            <div className="flex flex-col leading-tight gap-0.5">
              <span className="text-[15px] font-medium text-slate-900">User</span>
              <span className="text-[13px] text-slate-500">
                admin@example.com
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
