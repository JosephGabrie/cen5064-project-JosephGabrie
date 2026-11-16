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

  const userId = user?.id;
  const userRole = user?.role;

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

    if (userId) {
      const query =
        userRole === "student"
          ? `?student_id=${encodeURIComponent(userId)}`
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
  }, [classId, userId, userRole]);

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
      <div className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl rounded-2xl border border-[#679289]/35 bg-white p-6 sm:p-8 shadow-sm dark:bg-[#0d2b30]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#679289]/25 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#071e22] dark:text-white">
                Quizzes &amp; Auto-Graded Assessments
              </h1>
              <p className="mt-1 text-sm text-[#071e22]/75 dark:text-[#f8fbfa]/80">
                Class {classId} • Instant auto-grading feedback upon completion
              </p>
            </div>
            {viewMode === "list" && user?.role === "teacher" && (
              <Button
                onClick={() => setViewMode("create")}
                className="bg-[#1d7874] text-white hover:bg-[#071e22]"
              >
                + Create Quiz
              </Button>
            )}
          </div>

          {viewMode === "list" && (
            <div className="space-y-4">
              {quizzes.length === 0 ? (
                <p className="italic text-[#071e22]/60">
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
                    quiz.title?.trim() ||
                    quiz.questions?.[0]?.question ||
                    `Quiz #${idx + 1}`;

                  return (
                    <div
                      key={quiz.id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-[#679289]/35 bg-white p-5 shadow-xs transition-all hover:border-[#1d7874] hover:shadow-md sm:flex-row sm:items-center dark:bg-[#071e22]"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-[#f4c095]/45 px-2.5 py-0.5 text-xs font-bold text-[#071e22]">
                            {quiz.questions?.length || 0} Questions • {totalPts}{" "}
                            pts
                          </span>
                          {sub && (
                            <span className="rounded-md bg-[#1d7874]/15 px-2.5 py-0.5 text-xs font-bold text-[#1d7874]">
                              Auto-Graded: {sub.grade}
                              {sub.feedback
                                ? ` (${sub.feedback.percentage}%)`
                                : ""}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-[#071e22] dark:text-white">
                          {title}
                        </h3>
                        <p className="text-sm text-[#071e22]/70 dark:text-[#f8fbfa]/75">
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
