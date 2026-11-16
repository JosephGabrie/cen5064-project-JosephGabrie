"use client";

import React, { use } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/AuthContext";
import ClassroomAttendanceManager from "@/components/attendance/ClassroomAttendanceManager";

export default function AttendancePage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "student";

  if (role === "student") {
    return (
      <AuthGuard>
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-xl rounded-2xl border border-[#ee2e31]/40 bg-white p-8 text-center shadow-sm dark:bg-[#0d2b30]">
            <h1 className="text-2xl font-bold text-[#071e22] dark:text-white">
              Attendance Access Restricted
            </h1>
            <p className="mt-2 text-sm text-[#071e22]/75 dark:text-[#f8fbfa]/80">
              Attendance and classroom seating records are only viewable by teachers and parents.
            </p>
            <Link
              href={`/class/${classId}`}
              className="mt-6 inline-block rounded-lg bg-[#1d7874] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#071e22]"
            >
              Return to Class Overview
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-6xl">
          <ClassroomAttendanceManager
            classId={classId}
            userRole={role}
            userId={String(user?.id || "")}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
