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
import {
  Calendar,
  LayoutGrid,
  User as UserIcon,
  LogOut,
  Home,
  Megaphone,
  MessageSquare,
  ClipboardList,
  HelpCircle,
  GraduationCap,
  CheckCircle,
} from "lucide-react";
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
  const isStudent = user?.role?.toLowerCase() === "student";

  const classNavItems = classId
    ? [
        { title: "Home", url: `/class/${classId}`, icon: Home },
        { title: "Announcements", url: `/class/${classId}/announcements`, icon: Megaphone },
        { title: "Discussions", url: `/class/${classId}/discussions`, icon: MessageSquare },
        { title: "Assignments", url: `/class/${classId}/assignments`, icon: ClipboardList },
        { title: "Quizzes", url: `/class/${classId}/quizzes`, icon: HelpCircle },
        { title: "Grades", url: `/class/${classId}/grades`, icon: GraduationCap },
        ...(!isStudent
          ? [{ title: "Attendance", url: `/class/${classId}/attendance`, icon: CheckCircle }]
          : []),
      ]
    : [];

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "User";
  const displaySubtext =
    user?.email ||
    (user?.role
      ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} (ID: ${user?.id})`
      : user?.id || "");
  const avatarLetter = (
    user?.firstName?.[0] ||
    user?.email?.[0] ||
    user?.role?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <Sidebar className="bg-white text-[#071e22] border-r border-[#679289]/30">
      <SidebarHeader className="border-b border-[#679289]/25 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-[#1d7874] hover:text-[#071e22] transition-colors focus-visible:ring-2 focus-visible:ring-[#1d7874] rounded-lg px-2 py-1"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1d7874] text-sm font-extrabold text-white shadow-xs">
            M
          </span>
          <span>MTV School</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 space-y-4">
        {isClassRoute && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-xs font-bold uppercase tracking-wider text-[#1d7874]">
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
                        className="rounded-lg text-[15px] font-medium text-[#071e22]/80 hover:bg-[#679289]/15 hover:text-[#071e22] data-[active=true]:bg-[#1d7874] data-[active=true]:font-semibold data-[active=true]:text-white py-5 transition-colors"
                        render={
                          <Link
                            href={item.url}
                            onClick={(e) => {
                              if (isActive) {
                                e.preventDefault();
                              }
                            }}
                          />
                        }
                      >
                        <item.icon className="mr-2.5 h-5 w-5 text-[#1d7874] group-data-[active=true]/menu-button:text-white" />
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
          <SidebarGroupLabel className="px-3 text-xs font-bold uppercase tracking-wider text-[#679289]">
            {isClassRoute ? "MAIN NAVIGATION" : "NAVIGATION"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-2 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.url === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className="rounded-lg text-[15px] font-medium text-[#071e22]/80 hover:bg-[#679289]/15 hover:text-[#071e22] data-[active=true]:bg-[#1d7874] data-[active=true]:font-semibold data-[active=true]:text-white py-5 transition-colors"
                      render={
                        <Link
                          href={item.url}
                          onClick={(e) => {
                            if (pathname === item.url) {
                              e.preventDefault();
                            }
                          }}
                        />
                      }
                    >
                      <item.icon className="mr-2.5 h-5 w-5 text-[#1d7874] group-data-[active=true]/menu-button:text-white" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#679289]/25 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4c095] font-bold text-[#071e22] shadow-xs"
            >
              {avatarLetter}
            </div>
            <div className="flex flex-col leading-tight gap-0.5 min-w-0">
              <span className="text-[15px] font-semibold text-[#071e22] truncate">
                {displayName}
              </span>
              <span className="text-xs text-[#071e22]/70 truncate">
                {displaySubtext}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#ee2e31]/30 bg-[#ee2e31]/10 py-2.5 text-sm font-semibold text-[#ee2e31] shadow-2xs transition-colors hover:bg-[#ee2e31] hover:text-white focus-visible:ring-2 focus-visible:ring-[#ee2e31]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
