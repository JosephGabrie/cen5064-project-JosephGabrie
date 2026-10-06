"use client";

import React, { use } from "react";
import { AuthGuard } from "@/components/auth-guard";

export default function QuizzesPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);

  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
        <div className="w-full max-w-3xl p-8 bg-white rounded-xl shadow-md dark:bg-slate-800">
          <h1 className="mb-4 text-3xl font-bold text-slate-800 dark:text-white">
            Quizzes
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Quizzes for class {classId} will appear here.
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
