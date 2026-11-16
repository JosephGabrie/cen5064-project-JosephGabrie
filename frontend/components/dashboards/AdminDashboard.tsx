"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Search,
  Link2,
  Clock,
  HeartPulse,
  Phone,
  FileText,
  LayoutGrid,
} from "lucide-react";

export interface SchoolMetricsData {
  total_students: number;
  total_teachers: number;
  total_parents?: number;
  total_admins?: number;
  active_classes: number;
  student_teacher_ratio?: number;
  attendance_rate: number;
  attendance_status?: string;
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
  meeting_time?: string;
  teacher_id: string;
  teacher_name: string;
  enrolled_count: number;
  students: AdminEnrolledStudent[];
}

export interface AdminUserDirectoryRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  birthday?: string;
  address?: string;
  linked_parent_id?: string;
  linked_student_ids?: string[];
  allergies?: string;
  emergency_contact?: string;
  notes?: string;
}

type AdminSectionTab = "all" | "overview" | "classes" | "users";

function buildAdminHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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
  const [directoryUsers, setDirectoryUsers] = useState<
    AdminUserDirectoryRecord[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AdminSectionTab>("all");

  // User Directory Filter State
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] =
    useState<boolean>(false);
  const [newUserId, setNewUserId] = useState<string>("");
  const [newUserFirstName, setNewUserFirstName] = useState<string>("");
  const [newUserLastName, setNewUserLastName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<string>("student");
  const [newUserPassword, setNewUserPassword] = useState<string>("");
  // Student-specific attachment & medical fields
  const [newUserParentId, setNewUserParentId] = useState<string>("");
  const [newUserParentSearch, setNewUserParentSearch] = useState<string>("");
  const [newUserAllergies, setNewUserAllergies] = useState<string>("");
  const [newUserEmergencyContact, setNewUserEmergencyContact] =
    useState<string>("");
  const [newUserNotes, setNewUserNotes] = useState<string>("");
  // Parent-specific child attachment fields
  const [newUserStudentIds, setNewUserStudentIds] = useState<string[]>([]);
  const [newUserChildSearch, setNewUserChildSearch] = useState<string>("");

  const [createUserError, setCreateUserError] = useState<string>("");
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);

  // Link Parent to Student Modal State
  const [showLinkParentModal, setShowLinkParentModal] =
    useState<boolean>(false);
  const [linkParentId, setLinkParentId] = useState<string>("");
  const [linkParentSearch, setLinkParentSearch] = useState<string>("");
  const [linkStudentId, setLinkStudentId] = useState<string>("");
  const [linkStudentSearch, setLinkStudentSearch] = useState<string>("");
  const [linkStatusMessage, setLinkStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLinkingParent, setIsLinkingParent] = useState<boolean>(false);

  // Create Class Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [className, setClassName] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [roomNumber, setRoomNumber] = useState<string>("");
  const [meetingTime, setMeetingTime] = useState<string>(
    "MWF 9:00 AM - 10:00 AM"
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [teacherSearchQuery, setTeacherSearchQuery] = useState<string>("");
  const [createError, setCreateError] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Manage Roster Modal State
  const [rosterClassId, setRosterClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [enrollStudentSearch, setEnrollStudentSearch] = useState<string>("");
  const [rosterMessage, setRosterMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isUpdatingRoster, setIsUpdatingRoster] = useState<boolean>(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = buildAdminHeaders();
      const [metricsRes, classesRes, teachersRes, studentsRes, usersRes] =
        await Promise.all([
          fetch("http://localhost:6769/api/admin/metrics", { headers }),
          fetch("http://localhost:6769/api/admin/classes", { headers }),
          fetch("http://localhost:6769/api/admin/teachers", { headers }),
          fetch("http://localhost:6769/api/admin/students", { headers }),
          fetch("http://localhost:6769/api/admin/users", { headers }),
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
      if (usersRes && usersRes.ok) {
        const uData: AdminUserDirectoryRecord[] = await usersRes.json();
        if (Array.isArray(uData)) {
          setDirectoryUsers(uData);
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

  const filteredDirectoryUsers = useMemo(() => {
    const normalizedRole = userRoleFilter.trim().toLowerCase();
    const q = userSearchQuery.trim().toLowerCase();
    return directoryUsers.filter((u) => {
      if (
        normalizedRole &&
        normalizedRole !== "all" &&
        u.role.toLowerCase() !== normalizedRole
      ) {
        return false;
      }
      if (!q) return true;
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      return (
        fullName.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    });
  }, [directoryUsers, userRoleFilter, userSearchQuery]);

  const parentDirectoryOptions = useMemo(
    () => directoryUsers.filter((u) => u.role.toLowerCase() === "parent"),
    [directoryUsers]
  );

  const studentDirectoryOptions = useMemo(
    () => directoryUsers.filter((u) => u.role.toLowerCase() === "student"),
    [directoryUsers]
  );

  // Filtered options for Create User Modal (attaching Parent to Student or Children to Parent)
  const filteredCreateUserParents = useMemo(() => {
    const q = newUserParentSearch.trim().toLowerCase();
    if (!q) return parentDirectoryOptions;
    return parentDirectoryOptions.filter((p) => {
      const full = `${p.first_name} ${p.last_name}`.toLowerCase();
      return (
        full.includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    });
  }, [parentDirectoryOptions, newUserParentSearch]);

  const filteredCreateUserChildren = useMemo(() => {
    const q = newUserChildSearch.trim().toLowerCase();
    if (!q) return studentDirectoryOptions;
    return studentDirectoryOptions.filter((s) => {
      const full = `${s.first_name} ${s.last_name}`.toLowerCase();
      return (
        full.includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }, [studentDirectoryOptions, newUserChildSearch]);

  // Filtered options for Link Parent & Student Modal
  const filteredLinkParents = useMemo(() => {
    const q = linkParentSearch.trim().toLowerCase();
    if (!q) return parentDirectoryOptions;
    return parentDirectoryOptions.filter((p) => {
      const full = `${p.first_name} ${p.last_name}`.toLowerCase();
      return (
        full.includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    });
  }, [parentDirectoryOptions, linkParentSearch]);

  const filteredLinkStudents = useMemo(() => {
    const q = linkStudentSearch.trim().toLowerCase();
    if (!q) return studentDirectoryOptions;
    return studentDirectoryOptions.filter((s) => {
      const full = `${s.first_name} ${s.last_name}`.toLowerCase();
      return (
        full.includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }, [studentDirectoryOptions, linkStudentSearch]);

  // Filtered options for Schedule New Class Teacher picker
  const filteredTeachers = useMemo(() => {
    const q = teacherSearchQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const full = `${t.first_name} ${t.last_name}`.toLowerCase();
      return (
        full.includes(q) ||
        t.user_id.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
      );
    });
  }, [teachers, teacherSearchQuery]);

  // Filtered options for Manage Roster Student picker
  const filteredEnrollStudents = useMemo(() => {
    const q = enrollStudentSearch.trim().toLowerCase();
    if (!q) return allStudents;
    return allStudents.filter((st) => {
      const full = `${st.first_name} ${st.last_name}`.toLowerCase();
      return (
        full.includes(q) ||
        st.student_id.toLowerCase().includes(q) ||
        st.email.toLowerCase().includes(q)
      );
    });
  }, [allStudents, enrollStudentSearch]);

  const activeRosterClass = classes.find((c) => c.id === rosterClassId) || null;

  const toggleAttachedChild = (studentId: string) => {
    setNewUserStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const resetCreateUserForm = () => {
    setNewUserId("");
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserEmail("");
    setNewUserRole("student");
    setNewUserPassword("");
    setNewUserParentId("");
    setNewUserParentSearch("");
    setNewUserAllergies("");
    setNewUserEmergencyContact("");
    setNewUserNotes("");
    setNewUserStudentIds([]);
    setNewUserChildSearch("");
    setCreateUserError("");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError("");

    if (
      !newUserFirstName.trim() ||
      !newUserLastName.trim() ||
      !newUserEmail.trim() ||
      !newUserRole.trim() ||
      !newUserPassword.trim()
    ) {
      setCreateUserError("All user fields are required.");
      return;
    }

    const normalizedRole = newUserRole.trim().toLowerCase();
    setIsCreatingUser(true);
    try {
      const payload: Record<string, unknown> = {
        id: newUserId.trim(),
        first_name: newUserFirstName.trim(),
        last_name: newUserLastName.trim(),
        email: newUserEmail.trim(),
        role: normalizedRole,
        password: newUserPassword,
      };

      if (normalizedRole === "student") {
        if (newUserParentId.trim()) {
          payload.parent_id = newUserParentId.trim();
        }
        if (newUserAllergies.trim()) {
          payload.allergies = newUserAllergies.trim();
        }
        if (newUserEmergencyContact.trim()) {
          payload.emergency_contact = newUserEmergencyContact.trim();
        }
        if (newUserNotes.trim()) {
          payload.notes = newUserNotes.trim();
        }
      } else if (normalizedRole === "parent" && newUserStudentIds.length > 0) {
        payload.student_ids = newUserStudentIds;
      }

      const response = await fetch("http://localhost:6769/api/admin/users", {
        method: "POST",
        headers: buildAdminHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setCreateUserError(data.error || "Failed to create user.");
        return;
      }

      const createdRecord: AdminUserDirectoryRecord = {
        ...data,
        linked_parent_id:
          data.linked_parent_id ??
          (normalizedRole === "student" ? newUserParentId.trim() : undefined),
        linked_student_ids:
          data.linked_student_ids ??
          (normalizedRole === "parent" ? newUserStudentIds : undefined),
        allergies:
          data.allergies ??
          (normalizedRole === "student" ? newUserAllergies.trim() : undefined),
        emergency_contact:
          data.emergency_contact ??
          (normalizedRole === "student"
            ? newUserEmergencyContact.trim()
            : undefined),
        notes:
          data.notes ??
          (normalizedRole === "student" ? newUserNotes.trim() : undefined),
      };

      setDirectoryUsers((prev) => {
        const updated = prev.map((u) => {
          if (
            normalizedRole === "student" &&
            newUserParentId.trim() &&
            u.id === newUserParentId.trim()
          ) {
            const existing = u.linked_student_ids || [];
            return {
              ...u,
              linked_student_ids: existing.includes(createdRecord.id)
                ? existing
                : [...existing, createdRecord.id],
            };
          }
          if (
            normalizedRole === "parent" &&
            newUserStudentIds.includes(u.id)
          ) {
            return {
              ...u,
              linked_parent_id: createdRecord.id,
            };
          }
          return u;
        });
        return [...updated, createdRecord];
      });

      if (createdRecord.role === "student") {
        setAllStudents((prev) => [
          ...prev,
          {
            student_id: createdRecord.id,
            internal_id: createdRecord.id,
            first_name: createdRecord.first_name,
            last_name: createdRecord.last_name,
            email: createdRecord.email,
          },
        ]);
        setMetrics((prev) =>
          prev ? { ...prev, total_students: prev.total_students + 1 } : prev
        );
      } else if (createdRecord.role === "teacher") {
        setTeachers((prev) => [
          ...prev,
          {
            id: createdRecord.id,
            user_id: createdRecord.id,
            first_name: createdRecord.first_name,
            last_name: createdRecord.last_name,
            email: createdRecord.email,
            role: "teacher",
          },
        ]);
        setMetrics((prev) =>
          prev ? { ...prev, total_teachers: prev.total_teachers + 1 } : prev
        );
      }

      resetCreateUserForm();
      setShowCreateUserModal(false);
    } catch {
      setCreateUserError("Network error while creating user.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleLinkParentStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkStatusMessage(null);

    if (!linkParentId || !linkStudentId) {
      setLinkStatusMessage({
        type: "error",
        text: "Please select both a parent account and a student account.",
      });
      return;
    }

    setIsLinkingParent(true);
    try {
      const response = await fetch(
        "http://localhost:6769/api/admin/parent-links",
        {
          method: "POST",
          headers: buildAdminHeaders(),
          body: JSON.stringify({
            parent_id: linkParentId,
            student_id: linkStudentId,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        setLinkStatusMessage({
          type: "error",
          text: data.error || "Failed to link parent and student.",
        });
        return;
      }

      setDirectoryUsers((prev) =>
        prev.map((u) => {
          if (u.id === linkStudentId) {
            return { ...u, linked_parent_id: linkParentId };
          }
          if (u.id === linkParentId) {
            const current = u.linked_student_ids || [];
            if (!current.includes(linkStudentId)) {
              return { ...u, linked_student_ids: [...current, linkStudentId] };
            }
          }
          return u;
        })
      );

      setLinkStatusMessage({
        type: "success",
        text: `Linked parent (${linkParentId}) to student (${linkStudentId}) successfully.`,
      });
      setLinkParentId("");
      setLinkParentSearch("");
      setLinkStudentId("");
      setLinkStudentSearch("");
    } catch {
      setLinkStatusMessage({
        type: "error",
        text: "Network error while linking parent and student.",
      });
    } finally {
      setIsLinkingParent(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (
      !className.trim() ||
      !subject.trim() ||
      !roomNumber.trim() ||
      !selectedTeacherId
    ) {
      setCreateError(
        "All fields (Class Name, Subject, Room Number, and Teacher) are required."
      );
      return;
    }

    const finalMeetingTime = meetingTime.trim() || "MWF 9:00 AM - 10:00 AM";

    setIsCreating(true);
    try {
      const response = await fetch("http://localhost:6769/api/admin/classes", {
        method: "POST",
        headers: buildAdminHeaders(),
        body: JSON.stringify({
          name: className.trim(),
          subject: subject.trim(),
          room_number: roomNumber.trim(),
          meeting_time: finalMeetingTime,
          teacher_id: selectedTeacherId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setCreateError(data.error || "Failed to create class section.");
        return;
      }

      setClasses((prev) => [
        ...prev,
        {
          ...data,
          meeting_time: data.meeting_time || finalMeetingTime,
        },
      ]);
      setMetrics((prev) =>
        prev ? { ...prev, active_classes: prev.active_classes + 1 } : prev
      );
      setClassName("");
      setSubject("");
      setRoomNumber("");
      setMeetingTime("MWF 9:00 AM - 10:00 AM");
      setSelectedTeacherId("");
      setTeacherSearchQuery("");
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
      setEnrollStudentSearch("");
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

  const showOverview = activeTab === "all" || activeTab === "overview";
  const showClasses = activeTab === "all" || activeTab === "classes";
  const showUsers = activeTab === "all" || activeTab === "users";

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Top Command Header */}
        <div className="rounded-2xl border border-[#679289]/35 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4c095]/45 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#071e22]">
                <LayoutGrid className="h-3.5 w-3.5 text-[#1d7874]" />
                Administration Control Center
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#071e22]">
                School Administration Dashboard
              </h1>
              <p className="mt-1 text-sm text-[#071e22]/75">
                Manage school-wide KPIs, onboard students &amp; parents with medical/family profiles, and schedule classes.
              </p>
            </div>

            {/* Unified Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                data-testid="open-create-user-modal"
                onClick={() => {
                  resetCreateUserForm();
                  setShowCreateUserModal(true);
                }}
                className="flex items-center gap-1.5 bg-[#071e22] text-white hover:bg-[#1d7874]"
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
              <Button
                type="button"
                variant="outline"
                data-testid="open-link-parent-modal"
                onClick={() => {
                  setLinkStatusMessage(null);
                  setLinkParentId("");
                  setLinkParentSearch("");
                  setLinkStudentId("");
                  setLinkStudentSearch("");
                  setShowLinkParentModal(true);
                }}
                className="flex items-center gap-1.5"
              >
                <Link2 className="h-4 w-4" />
                Link Parent &amp; Student
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setCreateError("");
                  setTeacherSearchQuery("");
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 bg-[#1d7874] text-white hover:bg-[#071e22]"
              >
                <Plus className="h-4 w-4" />
                Create Class
              </Button>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div
            data-testid="admin-section-tabs"
            className="mt-6 flex flex-wrap gap-2 border-t border-[#679289]/25 pt-4"
          >
            {(
              [
                { id: "all", label: "All Sections" },
                { id: "overview", label: "Overview & Metrics" },
                {
                  id: "users",
                  label: `User Directory (${directoryUsers.length})`,
                },
                {
                  id: "classes",
                  label: `Class Schedule (${classes.length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#1d7874] text-white shadow-xs"
                    : "bg-[#679289]/15 text-[#071e22] hover:bg-[#f4c095]/45"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: School-Wide KPI Metrics Cards */}
        {showOverview && (
          <section aria-label="School-Wide Overview Metrics">
            <h2 className="mb-4 text-lg font-bold text-[#071e22]">
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
                    className="rounded-xl border border-[#679289]/35 bg-white p-5 shadow-sm"
                  >
                    <Skeleton className="mb-3 h-4 w-28" />
                    <Skeleton className="mb-2 h-8 w-16" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#679289]/35 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#071e22]/75">
                      Total Students
                    </span>
                    <div className="rounded-lg bg-[#1d7874]/15 p-2 text-[#1d7874]">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                  </div>
                  <p
                    data-testid="kpi-total-students"
                    className="mt-3 text-3xl font-extrabold text-[#071e22]"
                  >
                    {metrics?.total_students ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-[#071e22]/70">
                    Active K–8 enrolled students
                  </p>
                </div>

                <div className="rounded-xl border border-[#679289]/35 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#071e22]/75">
                      Total Teachers
                    </span>
                    <div className="rounded-lg bg-[#679289]/25 p-2 text-[#071e22]">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <p
                    data-testid="kpi-total-teachers"
                    className="mt-3 text-3xl font-extrabold text-[#071e22]"
                  >
                    {metrics?.total_teachers ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-[#071e22]/70">
                    Assigned instructional faculty
                  </p>
                </div>

                <div className="rounded-xl border border-[#679289]/35 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#071e22]/75">
                      Active Classes
                    </span>
                    <div className="rounded-lg bg-[#f4c095]/45 p-2 text-[#071e22]">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  </div>
                  <p
                    data-testid="kpi-active-classes"
                    className="mt-3 text-3xl font-extrabold text-[#071e22]"
                  >
                    {metrics?.active_classes ?? classes.length}
                  </p>
                  <p className="mt-1 text-xs text-[#071e22]/70">
                    Scheduled course sections
                  </p>
                </div>

                <div className="rounded-xl border border-[#679289]/35 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#071e22]/75">
                      Today&apos;s Attendance Rate
                    </span>
                    <div className="rounded-lg bg-[#1d7874] p-2 text-white">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                  <p
                    data-testid="kpi-attendance-rate"
                    className="mt-3 text-3xl font-extrabold text-[#1d7874]"
                  >
                    {metrics?.attendance_rate ?? 0}%
                  </p>
                  <p className="mt-1 text-xs text-[#071e22]/70">
                    Present: {metrics?.present_today ?? 0} · Tardy:{" "}
                    {metrics?.tardy_today ?? 0} · Absent:{" "}
                    {metrics?.absent_today ?? 0}
                  </p>
                </div>
              </div>
            )}

            {!loading && metrics && (
              <div
                data-testid="school-metrics-breakdown"
                className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-[#679289]/35 bg-white p-5 shadow-sm md:grid-cols-3"
              >
                <div className="flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#071e22]/70">
                    Campus Attendance Status
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      data-testid="kpi-attendance-status"
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                        metrics.attendance_status === "Healthy" ||
                        metrics.attendance_rate >= 90
                          ? "bg-[#1d7874] text-white"
                          : metrics.attendance_status === "Moderate" ||
                              metrics.attendance_rate >= 75
                            ? "bg-[#f4c095] text-[#071e22]"
                            : "bg-[#ee2e31]/15 text-[#ee2e31]"
                      }`}
                    >
                      {metrics.attendance_status ||
                        (metrics.total_recorded_today > 0
                          ? metrics.attendance_rate >= 90
                            ? "Healthy"
                            : "Moderate"
                          : "No Records Today")}
                    </span>
                    <span
                      data-testid="kpi-total-recorded-today"
                      className="text-xs text-[#071e22]/70"
                    >
                      ({metrics.total_recorded_today} logs recorded today)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#071e22]/70">
                    Student-to-Teacher Ratio
                  </span>
                  <p
                    data-testid="kpi-student-teacher-ratio"
                    className="mt-2 text-lg font-extrabold text-[#071e22]"
                  >
                    {metrics.student_teacher_ratio ??
                      (metrics.total_teachers > 0
                        ? Math.round(
                            (metrics.total_students / metrics.total_teachers) *
                              10
                          ) / 10
                        : 0)}{" "}
                    : 1
                  </p>
                </div>

                <div className="flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-[#071e22]">
                    <span className="font-bold uppercase tracking-wider text-[#071e22]/70">
                      Daily Attendance Breakdown
                    </span>
                    <span className="font-semibold">{metrics.attendance_rate}% Present/Tardy</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#679289]/25">
                    <div
                      className="h-full rounded-full bg-[#1d7874] transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, metrics.attendance_rate))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Section 2: User Management & Directory Section */}
        {showUsers && (
          <section
            aria-labelledby="user-directory-heading"
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2
                  id="user-directory-heading"
                  className="text-lg font-semibold text-slate-900"
                >
                  User Management &amp; Directory
                </h2>
                <p className="text-xs text-slate-500">
                  Search and filter school accounts by role, view student medical/contact notes, and manage parent-child links.
                </p>
              </div>
            </div>

            {/* Search & Role Filter Controls */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  aria-label="Search Users"
                  data-testid="user-search-input"
                  placeholder="Search by name, email, or ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="bg-white pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="user-role-filter"
                  className="text-xs font-semibold uppercase text-slate-500"
                >
                  Role:
                </label>
                <select
                  id="user-role-filter"
                  aria-label="Filter by Role"
                  data-testid="user-role-filter"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="parent">Parents</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            {/* Directory Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table
                  data-testid="user-directory-table"
                  className="w-full text-left text-sm"
                >
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <tr>
                      <th className="px-4 py-3.5">School ID</th>
                      <th className="px-4 py-3.5">Full Name</th>
                      <th className="px-4 py-3.5">Email</th>
                      <th className="px-4 py-3.5">Role</th>
                      <th className="px-4 py-3.5">Family / Portal Link</th>
                      <th className="px-4 py-3.5">
                        Medical / Emergency / Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredDirectoryUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-8 text-center text-slate-500"
                        >
                          No matching user accounts found.
                        </td>
                      </tr>
                    ) : (
                      filteredDirectoryUsers.map((u) => {
                        const roleLower = u.role.toLowerCase();
                        let badgeClasses = "bg-slate-100 text-slate-700";
                        if (roleLower === "student") {
                          badgeClasses = "bg-blue-50 text-blue-700";
                        } else if (roleLower === "teacher") {
                          badgeClasses = "bg-indigo-50 text-indigo-700";
                        } else if (roleLower === "parent") {
                          badgeClasses = "bg-amber-50 text-amber-700";
                        } else if (roleLower === "admin") {
                          badgeClasses = "bg-emerald-50 text-emerald-700";
                        }

                        return (
                          <tr
                            key={u.id}
                            className="transition-colors hover:bg-slate-50/80"
                          >
                            <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                              {u.id}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-slate-900">
                              {u.first_name} {u.last_name}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">
                              {u.email || "—"}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeClasses}`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600">
                              {roleLower === "student" && u.linked_parent_id ? (
                                <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                                  Parent ID: {u.linked_parent_id}
                                </span>
                              ) : roleLower === "parent" &&
                                u.linked_student_ids &&
                                u.linked_student_ids.length > 0 ? (
                                <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-800">
                                  Linked Children:{" "}
                                  {u.linked_student_ids.join(", ")}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600">
                              {roleLower === "student" &&
                              (u.allergies ||
                                u.emergency_contact ||
                                u.notes) ? (
                                <div className="space-y-1">
                                  {u.allergies && (
                                    <div className="flex items-center gap-1 text-rose-700">
                                      <HeartPulse className="h-3 w-3 shrink-0" />
                                      <span>Allergies: {u.allergies}</span>
                                    </div>
                                  )}
                                  {u.emergency_contact && (
                                    <div className="flex items-center gap-1 text-slate-700">
                                      <Phone className="h-3 w-3 shrink-0" />
                                      <span>
                                        Emergency: {u.emergency_contact}
                                      </span>
                                    </div>
                                  )}
                                  {u.notes && (
                                    <div className="flex items-center gap-1 text-slate-500">
                                      <FileText className="h-3 w-3 shrink-0" />
                                      <span>Note: {u.notes}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Class Scheduling & Teacher Assignment Section */}
        {showClasses && (
          <section
            aria-label="Class Scheduling and Teacher Assignment"
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Class Sections &amp; Teacher Assignments
                </h2>
                <p className="text-xs text-slate-500">
                  View scheduled classes, meeting times, assigned instructors, room numbers, and student enrollment rosters.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <tr>
                      <th className="px-5 py-3.5">Class Name</th>
                      <th className="px-5 py-3.5">Subject</th>
                      <th className="px-5 py-3.5">Room &amp; Schedule</th>
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
                            <div>Room {cls.room_number}</div>
                            {cls.meeting_time && (
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                {cls.meeting_time}
                              </div>
                            )}
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
                                setEnrollStudentSearch("");
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
        )}

        {/* Create User Modal */}
        {showCreateUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  Create New User Account
                </h3>
                <button
                  type="button"
                  aria-label="Close user modal"
                  onClick={() => setShowCreateUserModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="new-user-first-name"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      First Name
                    </label>
                    <Input
                      id="new-user-first-name"
                      aria-label="First Name"
                      placeholder="e.g. Elena"
                      value={newUserFirstName}
                      onChange={(e) => setNewUserFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-user-last-name"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Last Name
                    </label>
                    <Input
                      id="new-user-last-name"
                      aria-label="Last Name"
                      placeholder="e.g. Rivera"
                      value={newUserLastName}
                      onChange={(e) => setNewUserLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new-user-email"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Email Address
                  </label>
                  <Input
                    id="new-user-email"
                    type="email"
                    aria-label="Email Address"
                    placeholder="e.g. elena.rivera@school.edu"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="new-user-id"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      School ID (Optional)
                    </label>
                    <Input
                      id="new-user-id"
                      aria-label="School ID (Optional)"
                      placeholder="Auto-generated if blank"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-user-role"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      User Role
                    </label>
                    <select
                      id="new-user-role"
                      aria-label="User Role"
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new-user-password"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Initial Password
                  </label>
                  <Input
                    id="new-user-password"
                    type="password"
                    aria-label="Initial Password"
                    placeholder="At least 6 characters"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>

                {/* Student Role Specific Fields: Attach Parent, Allergies, Emergency Contact, Notes */}
                {newUserRole === "student" && (
                  <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      Student Profile: Parent Link, Medical &amp; Notes
                    </h4>

                    <div>
                      <label
                        htmlFor="new-user-parent-search"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        Attach Parent (Search by Name or ID)
                      </label>
                      <Input
                        id="new-user-parent-search"
                        aria-label="Search Parent to Attach"
                        placeholder="Type parent name or ID..."
                        value={newUserParentSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewUserParentSearch(val);
                          const exact = parentDirectoryOptions.find(
                            (p) =>
                              p.id.toLowerCase() === val.trim().toLowerCase() ||
                              `${p.first_name} ${p.last_name}`.toLowerCase() ===
                                val.trim().toLowerCase()
                          );
                          if (exact) {
                            setNewUserParentId(exact.id);
                          }
                        }}
                        className="mb-1.5 bg-white"
                      />
                      <select
                        id="new-user-parent-select"
                        aria-label="Attach Parent Account"
                        value={newUserParentId}
                        onChange={(e) => setNewUserParentId(e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="">No parent attached yet</option>
                        {filteredCreateUserParents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.first_name} {p.last_name} (ID: {p.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="new-user-allergies"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        Allergies
                      </label>
                      <Input
                        id="new-user-allergies"
                        aria-label="Allergies"
                        placeholder="e.g. Peanuts, Dairy, Penicillin (or None)"
                        value={newUserAllergies}
                        onChange={(e) => setNewUserAllergies(e.target.value)}
                        className="bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-user-emergency-contact"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        Emergency Contact Info
                      </label>
                      <Input
                        id="new-user-emergency-contact"
                        aria-label="Emergency Contact Info"
                        placeholder="e.g. Patty Parent • (555) 234-5678"
                        value={newUserEmergencyContact}
                        onChange={(e) =>
                          setNewUserEmergencyContact(e.target.value)
                        }
                        className="bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-user-notes"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        Student Notes
                      </label>
                      <Input
                        id="new-user-notes"
                        aria-label="Student Notes"
                        placeholder="e.g. Car rider, front row seating"
                        value={newUserNotes}
                        onChange={(e) => setNewUserNotes(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Parent Role Specific Fields: Attach Children (Students) */}
                {newUserRole === "parent" && (
                  <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Attach Children (Students)
                    </h4>
                    <div>
                      <label
                        htmlFor="new-user-child-search"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        Search Student by Name or ID
                      </label>
                      <Input
                        id="new-user-child-search"
                        aria-label="Search Children to Attach"
                        placeholder="Type student name or ID..."
                        value={newUserChildSearch}
                        onChange={(e) => setNewUserChildSearch(e.target.value)}
                        className="bg-white"
                      />
                    </div>

                    {newUserStudentIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {newUserStudentIds.map((sid) => {
                          const st = studentDirectoryOptions.find(
                            (s) => s.id === sid
                          );
                          return (
                            <span
                              key={sid}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900"
                            >
                              {st
                                ? `${st.first_name} ${st.last_name} (${sid})`
                                : sid}
                              <button
                                type="button"
                                onClick={() => toggleAttachedChild(sid)}
                                className="ml-1 text-amber-700 hover:text-amber-950"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                      {filteredCreateUserChildren.length === 0 ? (
                        <p className="p-2.5 text-center text-xs text-slate-400">
                          No matching students found.
                        </p>
                      ) : (
                        filteredCreateUserChildren.map((st) => {
                          const isChecked = newUserStudentIds.includes(st.id);
                          return (
                            <label
                              key={st.id}
                              className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs hover:bg-slate-50"
                            >
                              <span className="font-medium text-slate-800">
                                {st.first_name} {st.last_name}{" "}
                                <span className="text-slate-400">
                                  (ID: {st.id})
                                </span>
                              </span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleAttachedChild(st.id)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                              />
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {createUserError && (
                  <p className="rounded-md bg-red-50 p-2.5 text-xs font-medium text-red-600">
                    {createUserError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateUserModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingUser}
                    className="bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {isCreatingUser ? "Creating..." : "Create User Account"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Link Parent to Student Modal */}
        {showLinkParentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  Link Parent to Student Account
                </h3>
                <button
                  type="button"
                  aria-label="Close parent link modal"
                  onClick={() => setShowLinkParentModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleLinkParentStudent} className="space-y-4">
                <div>
                  <label
                    htmlFor="link-parent-select"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Parent Account
                  </label>
                  <Input
                    aria-label="Type Parent Name or ID"
                    placeholder="Type parent name or ID to search..."
                    value={linkParentSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLinkParentSearch(val);
                      const exact = parentDirectoryOptions.find(
                        (p) =>
                          p.id.toLowerCase() === val.trim().toLowerCase() ||
                          `${p.first_name} ${p.last_name}`.toLowerCase() ===
                            val.trim().toLowerCase()
                      );
                      if (exact) {
                        setLinkParentId(exact.id);
                      }
                    }}
                    className="mb-1.5"
                  />
                  <select
                    id="link-parent-select"
                    aria-label="Select Parent Account"
                    value={linkParentId}
                    onChange={(e) => setLinkParentId(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Choose a parent...</option>
                    {filteredLinkParents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} (ID: {p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="link-student-select"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Student Account
                  </label>
                  <Input
                    aria-label="Type Student Name or ID"
                    placeholder="Type student name or ID to search..."
                    value={linkStudentSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLinkStudentSearch(val);
                      const exact = studentDirectoryOptions.find(
                        (s) =>
                          s.id.toLowerCase() === val.trim().toLowerCase() ||
                          `${s.first_name} ${s.last_name}`.toLowerCase() ===
                            val.trim().toLowerCase()
                      );
                      if (exact) {
                        setLinkStudentId(exact.id);
                      }
                    }}
                    className="mb-1.5"
                  />
                  <select
                    id="link-student-select"
                    aria-label="Select Student Account"
                    value={linkStudentId}
                    onChange={(e) => setLinkStudentId(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Choose a student...</option>
                    {filteredLinkStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} (ID: {s.id})
                      </option>
                    ))}
                  </select>
                </div>

                {linkStatusMessage && (
                  <p
                    className={`rounded-md p-2.5 text-xs font-medium ${
                      linkStatusMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {linkStatusMessage.text}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLinkParentModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLinkingParent}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isLinkingParent ? "Linking..." : "Save Parent-Student Link"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

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

                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <div>
                  <label
                    htmlFor="admin-meeting-time"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Meeting Time
                  </label>
                  <Input
                    id="admin-meeting-time"
                    aria-label="Meeting Time"
                    placeholder="e.g. MWF 9:00 AM - 10:00 AM"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-teacher-select"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Assigned Teacher
                  </label>
                  <Input
                    aria-label="Type Teacher Name or ID"
                    placeholder="Type teacher name or ID to search..."
                    value={teacherSearchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeacherSearchQuery(val);
                      const exact = teachers.find(
                        (t) =>
                          t.user_id.toLowerCase() ===
                            val.trim().toLowerCase() ||
                          `${t.first_name} ${t.last_name}`.toLowerCase() ===
                            val.trim().toLowerCase()
                      );
                      if (exact) {
                        setSelectedTeacherId(exact.user_id);
                      }
                    }}
                    className="mb-1.5"
                  />
                  <select
                    id="admin-teacher-select"
                    aria-label="Assigned Teacher"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a teacher...</option>
                    {filteredTeachers.map((t) => (
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

              <form onSubmit={handleEnrollStudent} className="mb-5 space-y-2">
                <label
                  htmlFor="enroll-student-select"
                  className="block text-xs font-semibold uppercase text-slate-600"
                >
                  Enroll Student in Class
                </label>
                <Input
                  aria-label="Type Student to Enroll"
                  placeholder="Type student name or ID to filter..."
                  value={enrollStudentSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEnrollStudentSearch(val);
                    const exact = allStudents.find(
                      (st) =>
                        st.student_id.toLowerCase() ===
                          val.trim().toLowerCase() ||
                        `${st.first_name} ${st.last_name}`.toLowerCase() ===
                          val.trim().toLowerCase()
                    );
                    if (exact) {
                      setSelectedStudentId(exact.student_id);
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <select
                    id="enroll-student-select"
                    aria-label="Select Student to Enroll"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="">Choose a student...</option>
                    {filteredEnrollStudents.map((st) => (
                      <option key={st.student_id} value={st.student_id}>
                        {st.first_name} {st.last_name} (ID: {st.student_id})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    disabled={isUpdatingRoster}
                    className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Enroll Student
                  </Button>
                </div>
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
