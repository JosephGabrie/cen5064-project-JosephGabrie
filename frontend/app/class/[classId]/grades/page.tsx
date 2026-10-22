"use client";

import React, { use, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/AuthContext";
import {
  AssignmentData,
  SubmissionData,
} from "@/components/assignments/StudentAssignmentView";

export default function GradesPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    const subQuery =
      user.role === "student"
        ? `?student_id=${encodeURIComponent(user.id)}`
        : "";

    Promise.all([
      fetch(`http://localhost:6769/api/classes/${classId}/assignments`).then(
        (r) => r.json()
      ),
      fetch(
        `http://localhost:6769/api/classes/${classId}/submissions${subQuery}`
      ).then((r) => r.json()),
    ])
      .then(([assignData, subData]) => {
        if (Array.isArray(assignData)) setAssignments(assignData);
        if (Array.isArray(subData)) setSubmissions(subData);
      })
      .catch((err) => console.error("Error loading grades:", err))
      .finally(() => setLoading(false));
  }, [classId, user?.id, user?.role]);

  const assignmentMap = new Map<string, AssignmentData>();
  assignments.forEach((a) => assignmentMap.set(a.id, a));

  const percentages = submissions
    .map((s) => s.feedback?.percentage)
    .filter((p): p is number => typeof p === "number");
  const averagePct =
    percentages.length > 0
      ? Math.round(
          (percentages.reduce((acc, v) => acc + v, 0) / percentages.length) * 10
        ) / 10
      : null;

  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-start min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
        <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-md dark:bg-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Grades &amp; Feedback
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Class {classId} •{" "}
                {user?.role === "student"
                  ? "Your Submitted Assignments & Auto-Grade Breakdown"
                  : "Class Gradebook"}
              </p>
            </div>
            {averagePct !== null && (
              <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 text-right">
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Average Score
                </div>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {averagePct}%
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-slate-500">Loading grades...</p>
          ) : submissions.length === 0 ? (
            <p className="text-slate-500 italic">
              No graded submissions recorded for this class yet.
            </p>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => {
                const assign = assignmentMap.get(sub.assignment_id);
                const title =
                  assign?.questions?.[0]?.question ||
                  assign?.file ||
                  `Assignment ${sub.assignment_id.slice(0, 8)}`;

                return (
                  <div
                    key={sub.id}
                    className="p-5 border border-slate-200 rounded-xl bg-slate-50 dark:bg-slate-900 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                          {title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {user?.role !== "student" &&
                            `Student ID: ${sub.student_id} • `}
                          Submitted:{" "}
                          {new Date(sub.date_submitted).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Grade: {sub.grade}
                        </span>
                        {sub.feedback && (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {sub.feedback.earned_points} /{" "}
                            {sub.feedback.total_points} pts (
                            {sub.feedback.percentage}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {sub.feedback && sub.feedback.questions.length > 0 && (
                      <div className="grid gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        {sub.feedback.questions.map((qf, idx) => (
                          <div
                            key={qf.question_id || idx}
                            className="flex flex-wrap items-center justify-between text-xs bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="space-x-2">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                Q{idx + 1}: {qf.question_text}
                              </span>
                              <span className="text-slate-500">
                                (Answer: {qf.student_answer || "None"})
                              </span>
                            </div>
                            <span
                              className={`font-semibold ${
                                qf.is_correct
                                  ? "text-emerald-600"
                                  : qf.needs_review
                                  ? "text-amber-600"
                                  : "text-red-600"
                              }`}
                            >
                              {qf.awarded_points} / {qf.max_points} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
