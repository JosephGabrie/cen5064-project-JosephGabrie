"use client";

import React, { use } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { MessageSquare } from "lucide-react";

export default function DiscussionsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl rounded-2xl border border-[#679289]/35 bg-white p-6 sm:p-8 shadow-sm dark:bg-[#0d2b30]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d7874] text-white">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#071e22] dark:text-white">
                Discussions
              </h1>
              <p className="mt-1 text-sm text-[#071e22]/75 dark:text-[#f8fbfa]/80">
                Discussions for Class {classId} will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
