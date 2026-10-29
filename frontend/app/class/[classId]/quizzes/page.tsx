"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/AuthContext";
import CreateAssignmentForm from "@/components/assignments/CreateAssignmentForm";
import StudentAssignmentView, {
  AssignmentData,
  SubmissionData,
} from "@/components/assignments/StudentAssignmentView";
import { Button } from "@/components/ui/button";

export default function QuizzesPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<"list" | "create" | "take">("list");
  const [quizzes, setQuizzes] = useState<AssignmentData[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<AssignmentData | null>(null);

  const loadQuizzesAndSubmissions = useCallback(() => {
    fetch(`http://localhost:6769/api/classes/${classId}/assignments`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setQuizzes(
            data.filter((a: AssignmentData) => (a.questions?.length || 0) > 0)
          );
        }
      })
      .catch((err) => console.error("Error fetching quizzes:", err));

    if (user?.id) {
      const query =
        user.role === "student"
          ? `?student_id=${encodeURIComponent(user.id)}`
          : "";
      fetch(`http://localhost:6769/api/classes/${classId}/submissions${query}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSubmissions(data);
          }
        })
        .catch((err) => console.error("Error fetching quiz submissions:", err));
    }
  }, [classId, user?.id, user?.role]);

  useEffect(() => {
    loadQuizzesAndSubmissions();
  }, [loadQuizzesAndSubmissions]);

  const getSubmissionForQuiz = (quizId: string): SubmissionData | null => {
    if (!user?.id) return null;
    const found = submissions.filter(
      (s) =>
        s.assignment_id === quizId &&
        (user.role !== "student" || String(s.student_id) === String(user.id))
    );
    return found.length > 0 ? found[0] : null;
  };

  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-start min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
        <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-md dark:bg-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Quizzes &amp; Auto-Graded Assessments
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Class {classId} • Instant auto-grading feedback upon completion
              </p>
            </div>
            {viewMode === "list" && user?.role === "teacher" && (
              <Button onClick={() => setViewMode("create")}>
                + Create Quiz
              </Button>
            )}
          </div>

          {viewMode === "list" && (
            <div className="space-y-4">
              {quizzes.length === 0 ? (
                <p className="text-slate-500 italic">
                  No quizzes posted for this class yet.
                </p>
              ) : (
                quizzes.map((quiz, idx) => {
                  const sub = getSubmissionForQuiz(quiz.id);
                  const totalPts = (quiz.questions || []).reduce(
                    (acc, q) => acc + (Number(q.points) || 0),
                    0
                  );
                  const title =
                    quiz.questions?.[0]?.question || `Quiz #${idx + 1}`;

                  return (
                    <div
                      key={quiz.id}
                      className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md dark:bg-indigo-950 dark:text-indigo-300">
                            {quiz.questions?.length || 0} Questions • {totalPts}{" "}
                            pts
                          </span>
                          {sub && (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md dark:bg-emerald-950 dark:text-emerald-300">
                              Auto-Graded: {sub.grade}
                              {sub.feedback
                                ? ` (${sub.feedback.percentage}%)`
                                : ""}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                          {title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Due: {new Date(quiz.due_date).toLocaleString()}
                        </p>
                      </div>

                      <Button
                        variant={sub ? "outline" : "default"}
                        size="sm"
                        onClick={() => {
                          setSelectedQuiz(quiz);
                          setViewMode("take");
                        }}
                      >
                        {user?.role === "student"
                          ? sub
                            ? "View Instant Feedback"
                            : "Take Quiz"
                          : "Preview Quiz"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {viewMode === "take" && selectedQuiz && (
            <StudentAssignmentView
              assignment={selectedQuiz}
              studentId={String(user?.id || "")}
              existingSubmission={getSubmissionForQuiz(selectedQuiz.id)}
              readOnly={user?.role !== "student"}
              onBack={() => {
                setViewMode("list");
                setSelectedQuiz(null);
              }}
              onSubmitted={(newSub) => {
                setSubmissions((prev) => [newSub, ...prev]);
                loadQuizzesAndSubmissions();
              }}
            />
          )}

          {viewMode === "create" && (
            <CreateAssignmentForm
              classId={classId}
              onSuccess={() => {
                setViewMode("list");
                loadQuizzesAndSubmissions();
              }}
              onCancel={() => setViewMode("list")}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
