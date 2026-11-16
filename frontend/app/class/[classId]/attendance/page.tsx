"use client";

import React, { use } from "react";
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
        <div className="mx-auto w-full max-w-6xl">
          <ClassroomAttendanceManager
            classId={classId}
            userRole={user?.role || "student"}
            userId={String(user?.id || "")}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
