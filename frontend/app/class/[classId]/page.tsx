"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth-guard";

interface ClassAssignmentSummary {
  id: string;
  due_date: string;
  file?: string;
  questions?: { question: string }[];
}

interface ClassAnnouncementSummary {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function ClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { user } = useAuth();
  const { classId } = use(params);

  const [assignments, setAssignments] = useState<ClassAssignmentSummary[]>([]);
  const [announcements, setAnnouncements] = useState<
    ClassAnnouncementSummary[]
  >([]);
  const [studentCount, setStudentCount] = useState<number>(0);

  useEffect(() => {
    fetch(`http://localhost:6769/api/classes/${classId}/assignments`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAssignments(data);
      })
      .catch(() => {});

    fetch(`http://localhost:6769/api/classes/${classId}/announcements`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAnnouncements(data);
      })
      .catch(() => {});

    fetch(`http://localhost:6769/api/classes/${classId}/students`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setStudentCount(data.length);
      })
      .catch(() => {});
  }, [classId]);

  const quickLinks = [
    {
      title: "Assignments",
      description: "View, submit, or grade class assignments.",
      href: `/class/${classId}/assignments`,
    },
    {
      title: "Quizzes",
      description: "Take interactive quizzes and review auto-graded feedback.",
      href: `/class/${classId}/quizzes`,
    },
    {
      title: "Grades",
      description: "Check assignment scores and overall class performance.",
      href: `/class/${classId}/grades`,
    },
    {
      title: "Attendance & Seating",
      description:
        "View the interactive classroom seating grid and attendance records.",
      href: `/class/${classId}/attendance`,
    },
    {
      title: "Announcements",
      description: "Read or post class updates and reminders.",
      href: `/class/${classId}/announcements`,
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Class {classId} Overview
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Signed in as{" "}
                  <span className="font-semibold capitalize">
                    {user?.role || "student"}
                  </span>
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="rounded-lg bg-slate-100 px-4 py-2 dark:bg-slate-700">
                  <span className="block text-xs text-slate-500 dark:text-slate-300">
                    Enrolled Students
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {studentCount}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-100 px-4 py-2 dark:bg-slate-700">
                  <span className="block text-xs text-slate-500 dark:text-slate-300">
                    Assignments
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {assignments.length}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-100 px-4 py-2 dark:bg-slate-700">
                  <span className="block text-xs text-slate-500 dark:text-slate-300">
                    Announcements
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {announcements.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
