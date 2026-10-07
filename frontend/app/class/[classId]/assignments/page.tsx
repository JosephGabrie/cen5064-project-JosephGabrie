"use client";

import React, { use } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/AuthContext";
import CreateAssignmentForm from "@/components/assignments/CreateAssignmentForm";

export default function AssignmentsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
        <div className="w-full max-w-3xl p-8 bg-white rounded-xl shadow-md dark:bg-slate-800">
          <h1 className="mb-4 text-3xl font-bold text-slate-800 dark:text-white">
            Assignments
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8">
            Assignments for class {classId} will appear here.
          </p>
          
          {user?.role === 'teacher' && (
            <div className="mt-8">
              <CreateAssignmentForm classId={classId} />
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
