"use client";

import React, { use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth-guard";

export default function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { user } = useAuth();
  const { classId } = use(params);

  // In the future, this page will be populated with actual class data
  // and will use user.role to determine what functionality is available.
  
  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
        <div className="w-full max-w-3xl p-8 bg-white rounded-xl shadow-md dark:bg-slate-800">
          <h1 className="mb-4 text-3xl font-bold text-slate-800 dark:text-white">
            Class Dashboard
          </h1>
          
          <div className="mb-6 p-4 bg-slate-100 rounded-lg dark:bg-slate-700">
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Class ID:</span> {classId}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Your Role:</span> {user?.role || "Unknown"}
            </p>
          </div>

          <div className="py-12 text-center border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-700">
            {user?.role === "teacher" && (
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Teacher View: You have special privileges to manage this class. (Coming Soon)
              </p>
            )}
            {user?.role === "student" && (
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Student View: Here you will see your assignments and grades. (Coming Soon)
              </p>
            )}
            {user?.role === "admin" && (
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Admin View: You can oversee and administrate this class. (Coming Soon)
              </p>
            )}
            {!["teacher", "student", "admin"].includes(user?.role || "") && (
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Content for this class will be populated here later.
              </p>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
