"use client";

import React, { use, useEffect, useState, useMemo, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/AuthContext";
import {
  AssignmentData,
  SubmissionData,
} from "@/components/assignments/StudentAssignmentView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, MessageSquareText } from "lucide-react";

interface EnrolledStudentInfo {
  student_id: string | number;
  internal_id?: string | number;
  user_id?: string | number;
  first_name: string;
  last_name: string;
  email?: string;
}

interface StudentGradeGroup {
  studentId: string;
  studentName: string;
  submissions: SubmissionData[];
  overallPercentage: number | null;
}

export default function GradesPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [rosterStudents, setRosterStudents] = useState<EnrolledStudentInfo[]>(
    []
  );
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(
    null
  );
  const [gradeEdits, setGradeEdits] = useState<Record<string, string>>({});
  const [feedbackEdits, setFeedbackEdits] = useState<Record<string, string>>(
    {}
  );
  const [savingSubId, setSavingSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;
  const userRole = user?.role;

  const loadGradesData = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    const subQuery =
      userRole === "student"
        ? `?student_id=${encodeURIComponent(userId)}`
        : "";

    Promise.all([
      fetch(`http://localhost:6769/api/classes/${classId}/assignments`).then(
        (r) => (r.ok ? r.json() : [])
      ),
      fetch(
        `http://localhost:6769/api/classes/${classId}/submissions${subQuery}`
      ).then((r) => (r.ok ? r.json() : [])),
      fetch(`http://localhost:6769/api/classes/${classId}/students`).then(
        (r) => (r.ok ? r.json() : [])
      ),
    ])
      .then(([assignData, subData, studentData]) => {
        if (Array.isArray(assignData)) setAssignments(assignData);
        if (Array.isArray(subData)) setSubmissions(subData);
        if (Array.isArray(studentData)) setRosterStudents(studentData);
      })
      .catch((err) => console.error("Error loading grades:", err))
      .finally(() => setLoading(false));
  }, [classId, userId, userRole]);

  useEffect(() => {
    loadGradesData();
  }, [loadGradesData]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, AssignmentData>();
    assignments.forEach((a) => map.set(a.id, a));
    return map;
  }, [assignments]);

  const studentGroups = useMemo<StudentGradeGroup[]>(() => {
    const nameById: Record<string, string> = {};
    const canonicalById: Record<string, string> = {};

    rosterStudents.forEach((st) => {
      const canonical = String(st.user_id ?? st.student_id);
      const fullName = `${st.first_name} ${st.last_name}`.trim();
      if (st.student_id !== undefined) {
        canonicalById[String(st.student_id)] = canonical;
        nameById[String(st.student_id)] = fullName;
      }
      if (st.internal_id !== undefined) {
        canonicalById[String(st.internal_id)] = canonical;
        nameById[String(st.internal_id)] = fullName;
      }
      if (st.user_id !== undefined) {
        canonicalById[String(st.user_id)] = canonical;
        nameById[String(st.user_id)] = fullName;
      }
    });

    const groupedMap = new Map<
      string,
      { studentName: string; submissions: SubmissionData[] }
    >();

    // Seed with enrolled roster for teachers/admins so all students appear
    if (userRole !== "student") {
      rosterStudents.forEach((st) => {
        const canonical = String(st.user_id ?? st.student_id);
        const fullName =
          `${st.first_name} ${st.last_name}`.trim() || `Student ${canonical}`;
        if (!groupedMap.has(canonical)) {
          groupedMap.set(canonical, {
            studentName: fullName,
            submissions: [],
          });
        }
      });
    }

    submissions.forEach((sub) => {
      const rawId = String(sub.student_id);
      const canonical = canonicalById[rawId] || rawId;
      const resolvedName =
        (sub.student_name &&
        sub.student_name.trim() !== "" &&
        sub.student_name.trim() !== rawId
          ? sub.student_name.trim()
          : nameById[rawId] || nameById[canonical]) ||
        (userRole === "student" &&
        user?.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : `Student ${canonical}`);

      const existing = groupedMap.get(canonical);
      if (existing) {
        existing.submissions.push(sub);
      } else {
        groupedMap.set(canonical, {
          studentName: resolvedName,
          submissions: [sub],
        });
      }
    });

    return Array.from(groupedMap.entries()).map(([studentId, entry]) => {
      const pcts = entry.submissions
        .map((s) => {
          if (typeof s.feedback?.percentage === "number") {
            return s.feedback.percentage;
          }
          const num = Number(s.grade);
          return !Number.isNaN(num) && s.grade.trim() !== "" ? num : null;
        })
        .filter((p): p is number => typeof p === "number");

      const overallPercentage =
        pcts.length > 0
          ? Math.round(
              (pcts.reduce((acc, v) => acc + v, 0) / pcts.length) * 10
            ) / 10
          : null;

      return {
        studentId,
        studentName: entry.studentName,
        submissions: entry.submissions,
        overallPercentage,
      };
    });
  }, [rosterStudents, submissions, userRole, user?.firstName, user?.lastName]);

  const classAveragePct = useMemo(() => {
    const valid = studentGroups
      .map((g) => g.overallPercentage)
      .filter((p): p is number => typeof p === "number");
    if (valid.length === 0) return null;
    return (
      Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
    );
  }, [studentGroups]);

  const handleToggleStudent = (studentId: string) => {
    setExpandedStudentId((prev) => (prev === studentId ? null : studentId));
  };

  const handleSaveReview = async (sub: SubmissionData) => {
    const updatedGrade = gradeEdits[sub.id] ?? sub.grade;
    const updatedFeedback =
      feedbackEdits[sub.id] ?? sub.teacher_feedback ?? "";
    if (!updatedGrade.trim()) return;

    setSavingSubId(sub.id);
    try {
      const res = await fetch(
        `http://localhost:6769/api/submissions/${sub.id}/grade`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade: updatedGrade.trim(),
            teacher_feedback: updatedFeedback.trim(),
          }),
        }
      );
      if (res.ok) {
        loadGradesData();
      }
    } catch (err) {
      console.error("Failed to save review feedback:", err);
    } finally {
      setSavingSubId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl p-6 sm:p-8 bg-white rounded-2xl border border-[#679289]/35 shadow-sm dark:bg-[#0d2b30] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#679289]/25 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#071e22] dark:text-white">
                Grades &amp; Feedback
              </h1>
              <p className="text-[#071e22]/75 dark:text-[#f8fbfa]/80 mt-1 text-sm">
                Class {classId} • Click a student&apos;s name to view their assignments and review feedback
              </p>
            </div>
            {classAveragePct !== null && (
              <div className="px-4 py-2.5 rounded-xl bg-[#f4c095]/35 border border-[#f4c095] text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-[#071e22]">
                  Class Average
                </div>
                <div className="text-2xl font-extrabold text-[#1d7874]">
                  {classAveragePct}%
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-[#071e22]/70">Loading grades...</p>
          ) : studentGroups.length === 0 ? (
            <p className="text-[#071e22]/60 italic">
              No student grade records found for this class yet.
            </p>
          ) : (
            <div className="space-y-4">
              {studentGroups.map((group) => {
                const isExpanded = expandedStudentId === group.studentId;
                return (
                  <div
                    key={group.studentId}
                    className="overflow-hidden rounded-xl border border-[#679289]/35 bg-white shadow-xs dark:border-[#679289]/30 dark:bg-[#071e22]"
                  >
                    {/* Level 1: Student Row with Overall Grade (Clickable) */}
                    <button
                      type="button"
                      onClick={() => handleToggleStudent(group.studentId)}
                      data-testid={`student-grade-row-${group.studentId}`}
                      className="flex w-full items-center justify-between gap-4 bg-[#f8fbfa] px-5 py-4 text-left transition-colors hover:bg-[#679289]/15 dark:bg-[#0d2b30]"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-[#1d7874]" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-[#679289]" />
                        )}
                        <div>
                          <div className="text-lg font-bold text-[#071e22] dark:text-white">
                            {group.studentName}
                          </div>
                          <div className="text-xs font-medium text-[#071e22]/70">
                            {group.submissions.length} Assignment
                            {group.submissions.length === 1 ? "" : "s"}{" "}
                            Submitted
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3.5 py-1 text-sm font-bold ${
                            group.overallPercentage !== null
                              ? "bg-[#1d7874] text-white"
                              : "bg-[#679289]/20 text-[#071e22]"
                          }`}
                        >
                          Overall Grade:{" "}
                          {group.overallPercentage !== null
                            ? `${group.overallPercentage}%`
                            : "No Grades Yet"}
                        </span>
                      </div>
                    </button>

                    {/* Level 2: Student's Assignments & Bottom Review Feedback */}
                    {isExpanded && (
                      <div className="divide-y divide-[#679289]/25 border-t border-[#679289]/25 p-5 space-y-4">
                        {group.submissions.length === 0 ? (
                          <p className="text-sm italic text-[#071e22]/60">
                            No assignments submitted by {group.studentName} yet.
                          </p>
                        ) : (
                          group.submissions.map((sub) => {
                            const assign = assignmentMap.get(sub.assignment_id);
                            const title =
                              assign?.title?.trim() ||
                              assign?.questions?.[0]?.question ||
                              assign?.file ||
                              `Assignment ${sub.assignment_id.slice(0, 8)}`;

                            return (
                              <div
                                key={sub.id}
                                className="rounded-xl border border-[#679289]/30 bg-[#f8fbfa] p-4 space-y-3 dark:bg-[#0d2b30]"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <h3 className="font-bold text-base text-[#071e22] dark:text-white">
                                      {title}
                                    </h3>
                                    <p className="text-xs text-[#071e22]/70">
                                      Submitted:{" "}
                                      {new Date(
                                        sub.date_submitted
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1d7874] text-white">
                                      Grade: {sub.grade}
                                    </span>
                                    {sub.feedback && (
                                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#f4c095]/50 text-[#071e22]">
                                        {sub.feedback.earned_points} /{" "}
                                        {sub.feedback.total_points} pts (
                                        {sub.feedback.percentage}%)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {sub.feedback &&
                                  sub.feedback.questions.length > 0 && (
                                    <div className="grid gap-2 pt-2 border-t border-[#679289]/25">
                                      {sub.feedback.questions.map((qf, idx) => (
                                        <div
                                          key={qf.question_id || idx}
                                          className="flex flex-wrap items-center justify-between text-xs bg-white dark:bg-[#071e22] p-2.5 rounded-lg border border-[#679289]/30"
                                        >
                                          <div className="space-x-2">
                                            <span className="font-semibold text-[#071e22] dark:text-white">
                                              Q{idx + 1}: {qf.question_text}
                                            </span>
                                            <span className="text-[#071e22]/70">
                                              (Answer:{" "}
                                              {qf.student_answer || "None"})
                                            </span>
                                          </div>
                                          <span
                                            className={`font-bold ${
                                              qf.is_correct
                                                ? "text-[#1d7874]"
                                                : qf.needs_review
                                                ? "text-[#071e22]"
                                                : "text-[#ee2e31]"
                                            }`}
                                          >
                                            {qf.awarded_points} /{" "}
                                            {qf.max_points} pts
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                {/* Bottom of Assignment: Optional Teacher Review Feedback */}
                                <div className="pt-3 border-t border-[#679289]/25">
                                  {sub.teacher_feedback ? (
                                    <div className="flex items-start gap-2 rounded-lg border border-[#1d7874]/40 bg-[#f4c095]/25 p-3 text-xs text-[#071e22]">
                                      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#1d7874]" />
                                      <div>
                                        <span className="font-bold text-[#071e22]">
                                          Teacher Review Feedback:{" "}
                                        </span>
                                        <span>{sub.teacher_feedback}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs italic text-[#071e22]/60">
                                      No written review feedback attached to this assignment.
                                    </p>
                                  )}

                                  {userRole === "teacher" && (
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <Input
                                        placeholder="Grade"
                                        value={gradeEdits[sub.id] ?? sub.grade}
                                        onChange={(e) =>
                                          setGradeEdits((prev) => ({
                                            ...prev,
                                            [sub.id]: e.target.value,
                                          }))
                                        }
                                        className="w-28 bg-white text-xs"
                                      />
                                      <Input
                                        placeholder="Write optional review feedback for this assignment..."
                                        value={
                                          feedbackEdits[sub.id] ??
                                          sub.teacher_feedback ??
                                          ""
                                        }
                                        onChange={(e) =>
                                          setFeedbackEdits((prev) => ({
                                            ...prev,
                                            [sub.id]: e.target.value,
                                          }))
                                        }
                                        className="flex-1 bg-white text-xs"
                                      />
                                      <Button
                                        size="sm"
                                        disabled={savingSubId === sub.id}
                                        onClick={() => handleSaveReview(sub)}
                                      >
                                        {savingSubId === sub.id
                                          ? "Saving..."
                                          : "Save Review"}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
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
