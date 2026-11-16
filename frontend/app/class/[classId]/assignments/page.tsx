"use client";

import React, { use, useEffect, useState, useCallback, useMemo } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/AuthContext";
import CreateAssignmentForm from "@/components/assignments/CreateAssignmentForm";
import StudentAssignmentView, {
  AssignmentData,
  SubmissionData,
} from "@/components/assignments/StudentAssignmentView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClassRosterStudent {
  student_id: string | number;
  internal_id?: string | number;
  user_id?: string | number;
  first_name: string;
  last_name: string;
}

export default function AssignmentsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<
    "list" | "create" | "edit" | "view" | "submissions"
  >("list");
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [rosterStudents, setRosterStudents] = useState<ClassRosterStudent[]>(
    []
  );
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentData | null>(null);
  const [editingAssignment, setEditingAssignment] =
    useState<AssignmentData | null>(null);
  const [gradeEdits, setGradeEdits] = useState<Record<string, string>>({});
  const [feedbackEdits, setFeedbackEdits] = useState<Record<string, string>>(
    {}
  );
  const [savingGradeId, setSavingGradeId] = useState<string | null>(null);

  const userId = user?.id;
  const userRole = user?.role;

  const fetchAssignmentsAndSubmissions = useCallback(() => {
    fetch(`http://localhost:6769/api/classes/${classId}/assignments`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAssignments(data);
        }
      })
      .catch((err) => console.error("Error fetching assignments:", err));

    fetch(`http://localhost:6769/api/classes/${classId}/students`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRosterStudents(data);
        }
      })
      .catch(() => {});

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
        .catch((err) => console.error("Error fetching submissions:", err));
    }
  }, [classId, userId, userRole]);

  useEffect(() => {
    fetchAssignmentsAndSubmissions();
  }, [fetchAssignmentsAndSubmissions]);

  const studentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    rosterStudents.forEach((st) => {
      const fullName = `${st.first_name} ${st.last_name}`.trim();
      if (fullName) {
        if (st.student_id !== undefined) map[String(st.student_id)] = fullName;
        if (st.internal_id !== undefined)
          map[String(st.internal_id)] = fullName;
        if (st.user_id !== undefined) map[String(st.user_id)] = fullName;
      }
    });
    return map;
  }, [rosterStudents]);

  const getStudentDisplayName = (sub: SubmissionData): string => {
    if (
      sub.student_name &&
      sub.student_name.trim() !== "" &&
      sub.student_name.trim() !== String(sub.student_id)
    ) {
      return sub.student_name.trim();
    }
    return studentNameMap[String(sub.student_id)] || `Student (${sub.student_id})`;
  };

  const now = new Date();
  const activeAssignments = assignments.filter(
    (a) => new Date(a.due_date) >= now
  );
  const pastAssignments = assignments.filter((a) => new Date(a.due_date) < now);

  const getStudentSubmission = (assignmentId: string): SubmissionData | null => {
    if (!user?.id) return null;
    const matching = submissions.filter(
      (s) =>
        s.assignment_id === assignmentId &&
        (user.role !== "student" || String(s.student_id) === String(user.id))
    );
    return matching.length > 0 ? matching[0] : null;
  };

  const getAssignmentSubmissions = (assignmentId: string): SubmissionData[] =>
    submissions.filter((s) => s.assignment_id === assignmentId);

  const getAssignmentSummaryTitle = (a: AssignmentData, index: number) => {
    if (a.title && a.title.trim() !== "") {
      return a.title.trim();
    }
    if (a.questions && a.questions.length > 0 && a.questions[0].question) {
      const qText = a.questions[0].question;
      return qText.length > 60 ? `${qText.slice(0, 60)}...` : qText;
    }
    if (a.file) {
      return `Document Assignment: ${a.file}`;
    }
    return `Assignment #${index + 1}`;
  };

  const handleViewAssignment = (assignment: AssignmentData) => {
    setSelectedAssignment(assignment);
    setViewMode("view");
  };

  const handleViewSubmissions = (assignment: AssignmentData) => {
    setSelectedAssignment(assignment);
    const subMap: Record<string, string> = {};
    const fbMap: Record<string, string> = {};
    getAssignmentSubmissions(assignment.id).forEach((s) => {
      subMap[s.id] = s.grade;
      fbMap[s.id] = s.teacher_feedback || "";
    });
    setGradeEdits(subMap);
    setFeedbackEdits(fbMap);
    setViewMode("submissions");
  };

  const handleEditClick = (assignment: AssignmentData) => {
    setEditingAssignment(assignment);
    setViewMode("edit");
  };

  const handleSuccess = () => {
    setViewMode("list");
    setEditingAssignment(null);
    setSelectedAssignment(null);
    fetchAssignmentsAndSubmissions();
  };

  const handleCancel = () => {
    setViewMode("list");
    setEditingAssignment(null);
    setSelectedAssignment(null);
  };

  const handleSaveManualGrade = async (submissionId: string) => {
    const newGrade = gradeEdits[submissionId];
    const newFeedback = feedbackEdits[submissionId] ?? "";
    if (newGrade === undefined) return;
    setSavingGradeId(submissionId);
    try {
      const res = await fetch(
        `http://localhost:6769/api/submissions/${submissionId}/grade`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade: newGrade,
            teacher_feedback: newFeedback,
          }),
        }
      );
      if (res.ok) {
        fetchAssignmentsAndSubmissions();
      }
    } catch (err) {
      console.error("Failed to update grade:", err);
    } finally {
      setSavingGradeId(null);
    }
  };

  const renderAssignmentCard = (
    a: AssignmentData,
    index: number,
    isPastDue = false
  ) => {
    const studentSub = getStudentSubmission(a.id);
    const allSubsForAssignment = getAssignmentSubmissions(a.id);
    const totalPoints = (a.questions || []).reduce(
      (sum, q) => sum + (Number(q.points) || 0),
      0
    );

    return (
      <div
        key={a.id}
        className={`p-5 border rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isPastDue
            ? "border-[#679289]/30 bg-[#f8fbfa] dark:bg-[#071e22] dark:border-[#679289]/25"
            : "border-[#679289]/35 bg-white hover:border-[#1d7874] hover:shadow-md dark:bg-[#0d2b30] dark:border-[#679289]/30"
        }`}
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#071e22] bg-[#f4c095]/45 px-2.5 py-0.5 rounded-md">
              {a.file
                ? "File / Resource"
                : `${a.questions?.length || 0} Question${
                    (a.questions?.length || 0) === 1 ? "" : "s"
                  }`}
            </span>
            {totalPoints > 0 && (
              <span className="text-xs font-semibold text-[#071e22] bg-[#679289]/20 px-2.5 py-0.5 rounded-md dark:text-white">
                {totalPoints} pts
              </span>
            )}
            {studentSub && (
              <span className="text-xs font-bold text-white bg-[#1d7874] px-2.5 py-0.5 rounded-md">
                Submitted • Grade: {studentSub.grade}
                {studentSub.feedback
                  ? ` (${studentSub.feedback.percentage}%)`
                  : ""}
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg text-[#071e22] dark:text-white">
            {getAssignmentSummaryTitle(a, index)}
          </h3>
          <p
            className={`text-sm ${
              isPastDue
                ? "text-[#ee2e31] font-semibold"
                : "text-[#071e22]/70 dark:text-[#f8fbfa]/75"
            }`}
          >
            Due: {new Date(a.due_date).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={studentSub ? "outline" : "default"}
            size="sm"
            onClick={() => handleViewAssignment(a)}
          >
            {user?.role === "student"
              ? studentSub
                ? "View Contents & Feedback"
                : "View & Start Assignment"
              : "View Contents"}
          </Button>

          {user?.role === "teacher" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewSubmissions(a)}
              >
                Submissions ({allSubsForAssignment.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditClick(a)}
              >
                Edit
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl p-6 sm:p-8 bg-white rounded-2xl border border-[#679289]/35 shadow-sm dark:bg-[#0d2b30]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-[#679289]/25 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#071e22] dark:text-white">
                Assignments
              </h1>
              <p className="text-[#071e22]/75 dark:text-[#f8fbfa]/80 mt-1 text-sm">
                Class {classId}
              </p>
            </div>
            {viewMode === "list" && user?.role === "teacher" && (
              <Button
                onClick={() => setViewMode("create")}
                className="bg-[#1d7874] text-white hover:bg-[#071e22]"
              >
                + Create Assignment
              </Button>
            )}
          </div>

          {viewMode === "list" && (
            <div className="space-y-8">
              {/* Active Assignments */}
              <div>
                <h2 className="text-xl font-bold text-[#071e22] dark:text-white mb-4 border-b border-[#679289]/25 pb-2">
                  Active Assignments
                </h2>
                {activeAssignments.length === 0 ? (
                  <p className="text-[#071e22]/60 italic">
                    No active assignments.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {activeAssignments.map((a, idx) =>
                      renderAssignmentCard(a, idx, false)
                    )}
                  </div>
                )}
              </div>

              {/* Past Due Assignments */}
              <div>
                <h2 className="text-xl font-bold text-[#071e22] dark:text-white mb-4 border-b border-[#679289]/25 pb-2">
                  Past Due
                </h2>
                {pastAssignments.length === 0 ? (
                  <p className="text-[#071e22]/60 italic">No past assignments.</p>
                ) : (
                  <div className="grid gap-4">
                    {pastAssignments.map((a, idx) =>
                      renderAssignmentCard(a, idx, true)
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === "view" && selectedAssignment && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <StudentAssignmentView
                assignment={selectedAssignment}
                studentId={String(user?.id || "")}
                existingSubmission={getStudentSubmission(selectedAssignment.id)}
                readOnly={user?.role !== "student"}
                onBack={handleCancel}
                onSubmitted={(newSub) => {
                  setSubmissions((prev) => [newSub, ...prev]);
                  fetchAssignmentsAndSubmissions();
                }}
              />
            </div>
          )}

          {viewMode === "submissions" && selectedAssignment && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    Student Submissions
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedAssignment.title?.trim()
                      ? selectedAssignment.title
                      : `Assignment ID: ${selectedAssignment.id}`}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  &larr; Back to Assignments
                </Button>
              </div>

              {getAssignmentSubmissions(selectedAssignment.id).length === 0 ? (
                <p className="text-slate-500 italic">
                  No submissions received for this assignment yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {getAssignmentSubmissions(selectedAssignment.id).map((sub) => (
                    <div
                      key={sub.id}
                      className="p-5 border border-slate-200 rounded-xl bg-slate-50 dark:bg-slate-900 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {getStudentDisplayName(sub)}
                          </span>
                          <span className="text-xs text-slate-500 ml-3">
                            Submitted:{" "}
                            {new Date(sub.date_submitted).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Grade:
                          </span>
                          <Input
                            className="w-28 bg-white dark:bg-slate-800"
                            value={gradeEdits[sub.id] ?? sub.grade}
                            onChange={(e) =>
                              setGradeEdits((prev) => ({
                                ...prev,
                                [sub.id]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            disabled={savingGradeId === sub.id}
                            onClick={() => handleSaveManualGrade(sub.id)}
                          >
                            {savingGradeId === sub.id ? "Saving..." : "Update"}
                          </Button>
                        </div>
                      </div>

                      {sub.feedback && (
                        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 dark:bg-emerald-950/30 dark:text-emerald-300">
                          Auto-Grade Summary: {sub.feedback.earned_points} /{" "}
                          {sub.feedback.total_points} pts (
                          {sub.feedback.percentage}%)
                        </div>
                      )}

                      <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                        {(sub.student_answer || []).map((ans, i) => (
                          <div
                            key={`${sub.id}-ans-${i}`}
                            className="text-sm text-slate-700 dark:text-slate-300"
                          >
                            <span className="font-medium">Q{i + 1}:</span>{" "}
                            {ans.answer || "(No answer)"}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <label
                          htmlFor={`feedback-${sub.id}`}
                          className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                          Review Feedback for Student (Optional)
                        </label>
                        <Input
                          id={`feedback-${sub.id}`}
                          placeholder="Write optional feedback for this student's submission..."
                          value={
                            feedbackEdits[sub.id] ?? sub.teacher_feedback ?? ""
                          }
                          onChange={(e) =>
                            setFeedbackEdits((prev) => ({
                              ...prev,
                              [sub.id]: e.target.value,
                            }))
                          }
                          className="bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {viewMode === "create" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CreateAssignmentForm
                classId={classId}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </div>
          )}

          {viewMode === "edit" && editingAssignment && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CreateAssignmentForm
                classId={classId}
                initialData={editingAssignment}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
