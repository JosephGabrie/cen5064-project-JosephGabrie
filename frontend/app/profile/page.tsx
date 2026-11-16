"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, ShieldCheck, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <Card className="overflow-hidden rounded-2xl border border-[#679289]/35 bg-white shadow-sm dark:bg-[#0d2b30]">
        <div className="h-20 bg-[#1d7874]" />
        <CardHeader className="border-b border-[#679289]/25 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4c095] text-xl font-extrabold text-[#071e22] shadow-xs"
              >
                {(user?.firstName?.[0] || "U").toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-[#071e22] dark:text-white">
                  Profile
                </CardTitle>
                <CardDescription className="text-sm text-[#071e22]/70 dark:text-[#f8fbfa]/75">
                  Welcome to your MTV School profile dashboard.
                </CardDescription>
              </div>
            </div>
            {user?.role && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d7874] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
                {user.role}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#679289]/30 bg-[#f8fbfa] p-4 dark:bg-[#071e22]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1d7874]">
                <UserIcon className="h-3.5 w-3.5" />
                <span>Name</span>
              </div>
              <p className="mt-1.5 text-base font-semibold text-[#071e22] dark:text-white">
                {fullName}
              </p>
            </div>
            <div className="rounded-xl border border-[#679289]/30 bg-[#f8fbfa] p-4 dark:bg-[#071e22]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1d7874]">
                <Mail className="h-3.5 w-3.5" />
                <span>Email</span>
              </div>
              <p className="mt-1.5 text-base font-semibold text-[#071e22] dark:text-white">
                {user?.email || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
