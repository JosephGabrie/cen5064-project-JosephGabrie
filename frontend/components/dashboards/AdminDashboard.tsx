"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Plus,
  UserPlus,
  Trash2,
  X,
} from "lucide-react";

export interface SchoolMetricsData {
  total_students: number;
  total_teachers: number;
  active_classes: number;
  attendance_rate: number;
  present_today: number;
  absent_today: number;
  tardy_today: number;
  total_recorded_today: number;
}

export interface AdminTeacherOption {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface AdminEnrolledStudent {
  student_id: string;
  internal_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface AdminClassSectionData {
  id: string;
  name: string;
  subject: string;
  room_number: string;
  teacher_id: string;
  teacher_name: string;
  enrolled_count: number;
  students: AdminEnrolledStudent[];
}

function buildAdminHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Role": "admin",
  };
  if (
    typeof window !== "undefined" &&
    typeof window.localStorage?.getItem === "function"
  ) {
    const token = window.localStorage.getItem("token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<SchoolMetricsData | null>(null);
  const [classes, setClasses] = useState<AdminClassSectionData[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacherOption[]>([]);
  const [allStudents, setAllStudents] = useState<AdminEnrolledStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Create Class Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [className, setClassName] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [roomNumber, setRoomNumber] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [createError, setCreateError] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Manage Roster Modal State
  const [rosterClassId, setRosterClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [rosterMessage, setRosterMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isUpdatingRoster, setIsUpdatingRoster] = useState<boolean>(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = buildAdminHeaders();
      const [metricsRes, classesRes, teachersRes, studentsRes] =
        await Promise.all([
          fetch("http://localhost:6769/api/admin/metrics", { headers }),
          fetch("http://localhost:6769/api/admin/classes", { headers }),
          fetch("http://localhost:6769/api/admin/teachers", { headers }),
          fetch("http://localhost:6769/api/admin/students", { headers }),
        ]);

      if (metricsRes.ok) {
        const mData: SchoolMetricsData = await metricsRes.json();
        setMetrics(mData);
      }
      if (classesRes.ok) {
        const cData: AdminClassSectionData[] = await classesRes.json();
        if (Array.isArray(cData)) {
          setClasses(cData);
        }
      }
      if (teachersRes.ok) {
        const tData: AdminTeacherOption[] = await teachersRes.json();
        if (Array.isArray(tData)) {
          setTeachers(tData);
        }
      }
      if (studentsRes.ok) {
        const sData: AdminEnrolledStudent[] = await studentsRes.json();
        if (Array.isArray(sData)) {
          setAllStudents(sData);
        }
      }
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const activeRosterClass = classes.find((c) => c.id === rosterClassId) || null;

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!className.trim() || !subject.trim() || !roomNumber.trim() || !selectedTeacherId) {
      setCreateError("All fields (Class Name, Subject, Room Number, and Teacher) are required.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("http://localhost:6769/api/admin/classes", {
        method: "POST",
        headers: buildAdminHeaders(),
        body: JSON.stringify({
          name: className.trim(),
          subject: subject.trim(),
          room_number: roomNumber.trim(),
          teacher_id: selectedTeacherId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setCreateError(data.error || "Failed to create class section.");
        return;
      }

      setClasses((prev) => [...prev, data]);
      setMetrics((prev) =>
        prev ? { ...prev, active_classes: prev.active_classes + 1 } : prev
      );
      setClassName("");
      setSubject("");
      setRoomNumber("");
      setSelectedTeacherId("");
      setShowCreateModal(false);
    } catch {
      setCreateError("Network error while creating class.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterClassId || !selectedStudentId) {
      setRosterMessage({
        type: "error",
        text: "Please select a student to enroll.",
      });
      return;
    }

    setIsUpdatingRoster(true);
    setRosterMessage(null);
    try {
      const response = await fetch(
        `http://localhost:6769/api/admin/classes/${encodeURIComponent(
          rosterClassId
        )}/enroll`,
        {
          method: "POST",
          headers: buildAdminHeaders(),
          body: JSON.stringify({ student_id: selectedStudentId }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        setRosterMessage({
          type: "error",
          text: data.error || "Failed to enroll student.",
        });
        return;
      }

      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id !== rosterClassId) return cls;
          const updatedStudents = [...(cls.students || []), data];
          return {
            ...cls,
            students: updatedStudents,
            enrolled_count: updatedStudents.length,
          };
        })
      );
      setSelectedStudentId("");
      setRosterMessage({
        type: "success",
        text: `Enrolled ${data.first_name} ${data.last_name} successfully.`,
      });
    } catch {
      setRosterMessage({
        type: "error",
        text: "Network error while enrolling student.",
      });
    } finally {
      setIsUpdatingRoster(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!rosterClassId) return;
    setIsUpdatingRoster(true);
    setRosterMessage(null);
    try {
      const response = await fetch(
        `http://localhost:6769/api/admin/classes/${encodeURIComponent(
          rosterClassId
        )}/enroll/${encodeURIComponent(studentId)}`,
        {
          method: "DELETE",
          headers: buildAdminHeaders(),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setRosterMessage({
          type: "error",
          text: errData.error || "Failed to remove student from class.",
        });
        return;
      }

      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id !== rosterClassId) return cls;
          const updatedStudents = (cls.students || []).filter(
            (st) =>
              st.student_id !== studentId && st.internal_id !== studentId
          );
          return {
            ...cls,
            students: updatedStudents,
            enrolled_count: updatedStudents.length,
          };
        })
      );
      setRosterMessage({
        type: "success",
        text: "Student removed from class roster.",
      });
    } catch {
      setRosterMessage({
        type: "error",
        text: "Network error while removing student.",
      });
    } finally {
      setIsUpdatingRoster(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              School Administration Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor school-wide operational KPIs, schedule class sections, assign teachers, and manage student rosters.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setCreateError("");
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Class
          </Button>
        </div>

        {/* School-Wide KPI Metrics Cards */}
        <section aria-label="School-Wide Overview Metrics">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            School-Wide Overview Metrics
          </h2>
          {loading ? (
            <div
              data-testid="metrics-skeleton"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <Skeleton className="mb-3 h-4 w-28" />
                  <Skeleton className="mb-2 h-8 w-16" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Total Students
                  </span>
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                </div>
                <p
                  data-testid="kpi-total-students"
                  className="mt-3 text-3xl font-bold text-slate-900"
                >
                  {metrics?.total_students ?? 0}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Active K–8 enrolled students
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Total Teachers
                  </span>
                  <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <p
                  data-testid="kpi-total-teachers"
                  className="mt-3 text-3xl font-bold text-slate-900"
                >
                  {metrics?.total_teachers ?? 0}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Assigned instructional faculty
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Active Classes
                  </span>
                  <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
                <p
                  data-testid="kpi-active-classes"
                  className="mt-3 text-3xl font-bold text-slate-900"
                >
                  {metrics?.active_classes ?? classes.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Scheduled course sections
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Today&apos;s Attendance Rate
                  </span>
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <p
                  data-testid="kpi-attendance-rate"
                  className="mt-3 text-3xl font-bold text-emerald-600"
                >
                  {metrics?.attendance_rate ?? 0}%
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Present: {metrics?.present_today ?? 0} · Tardy:{" "}
                  {metrics?.tardy_today ?? 0} · Absent:{" "}
                  {metrics?.absent_today ?? 0}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Class Scheduling & Teacher Assignment Section */}
        <section aria-label="Class Scheduling and Teacher Assignment">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Class Sections & Teacher Assignments
              </h2>
              <p className="text-xs text-slate-500">
                View scheduled classes, assigned instructors, room numbers, and student enrollment rosters.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                  <tr>
                    <th className="px-5 py-3.5">Class Name</th>
                    <th className="px-5 py-3.5">Subject</th>
                    <th className="px-5 py-3.5">Room Number</th>
                    <th className="px-5 py-3.5">Assigned Teacher</th>
                    <th className="px-5 py-3.5">Enrolled Students</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-slate-500"
                      >
                        No classes scheduled yet. Click &quot;Create Class&quot; to add a section.
                      </td>
                    </tr>
                  ) : (
                    classes.map((cls) => (
                      <tr
                        key={cls.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {cls.name}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {cls.subject}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          Room {cls.room_number}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {cls.teacher_name}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <span className="font-semibold text-slate-900">
                            {cls.enrolled_count}
                          </span>{" "}
                          students
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRosterMessage(null);
                              setSelectedStudentId("");
                              setRosterClassId(cls.id);
                            }}
                          >
                            Manage Roster
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Create Class Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  Schedule New Class Section
                </h3>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-class-name"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Class Name
                  </label>
                  <Input
                    id="admin-class-name"
                    aria-label="Class Name"
                    placeholder="e.g. Grade 6 Mathematics"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-class-subject"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Subject
                  </label>
                  <Input
                    id="admin-class-subject"
                    aria-label="Subject"
                    placeholder="e.g. Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-room-number"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Room Number
                  </label>
                  <Input
                    id="admin-room-number"
                    aria-label="Room Number"
                    placeholder="e.g. 204B"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-teacher-select"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Assigned Teacher
                  </label>
                  <select
                    id="admin-teacher-select"
                    aria-label="Assigned Teacher"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a teacher...</option>
                    {teachers.map((t) => (
                      <option key={t.user_id} value={t.user_id}>
                        {t.first_name} {t.last_name} (ID: {t.user_id})
                      </option>
                    ))}
                  </select>
                </div>

                {createError && (
                  <p className="rounded-md bg-red-50 p-2.5 text-xs font-medium text-red-600">
                    {createError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isCreating ? "Saving..." : "Save Class Section"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Class Roster Modal */}
        {activeRosterClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Manage Class Roster — {activeRosterClass.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Teacher: {activeRosterClass.teacher_name} · Room{" "}
                    {activeRosterClass.room_number}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close roster modal"
                  onClick={() => setRosterClassId(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleEnrollStudent}
                className="mb-5 flex items-end gap-2"
              >
                <div className="flex-1">
                  <label
                    htmlFor="enroll-student-select"
                    className="mb-1 block text-xs font-semibold uppercase text-slate-600"
                  >
                    Enroll Student in Class
                  </label>
                  <select
                    id="enroll-student-select"
                    aria-label="Select Student to Enroll"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="">Choose a student...</option>
                    {allStudents.map((st) => (
                      <option key={st.student_id} value={st.student_id}>
                        {st.first_name} {st.last_name} (ID: {st.student_id})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="submit"
                  disabled={isUpdatingRoster}
                  className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4" />
                  Enroll Student
                </Button>
              </form>

              {rosterMessage && (
                <div
                  className={`mb-4 rounded-md p-2.5 text-xs font-medium ${
                    rosterMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {rosterMessage.text}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                {(activeRosterClass.students || []).length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-500">
                    No students currently enrolled in this class section.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200 text-sm">
                    {activeRosterClass.students.map((st) => (
                      <li
                        key={st.student_id}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {st.first_name} {st.last_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID: {st.student_id}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${st.first_name} ${st.last_name}`}
                          disabled={isUpdatingRoster}
                          onClick={() => handleRemoveStudent(st.student_id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRosterClassId(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

export default AdminDashboard;
