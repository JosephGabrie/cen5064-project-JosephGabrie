"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth-guard";
import {
  ClipboardList,
  HelpCircle,
  GraduationCap,
  CheckCircle,
  Megaphone,
  ArrowRight,
} from "lucide-react";

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

  const isStudent = user?.role?.toLowerCase() === "student";

  const quickLinks = [
    {
      title: "Assignments",
      description: "View, submit, or grade class assignments.",
      href: `/class/${classId}/assignments`,
      icon: ClipboardList,
    },
    {
      title: "Quizzes",
      description: "Take interactive quizzes and review auto-graded feedback.",
      href: `/class/${classId}/quizzes`,
      icon: HelpCircle,
    },
    {
      title: "Grades",
      description: "Check assignment scores and overall class performance.",
      href: `/class/${classId}/grades`,
      icon: GraduationCap,
    },
    ...(!isStudent
      ? [
          {
            title: "Attendance & Seating",
            description:
              "View the interactive classroom seating grid and attendance records.",
            href: `/class/${classId}/attendance`,
            icon: CheckCircle,
          },
        ]
      : []),
    {
      title: "Announcements",
      description: "Read or post class updates and reminders.",
      href: `/class/${classId}/announcements`,
      icon: Megaphone,
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="rounded-2xl border border-[#679289]/35 bg-white p-6 shadow-sm dark:bg-[#0d2b30]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#f4c095]/45 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#071e22]">
                  Course Hub
                </span>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#071e22] dark:text-white">
                  Class {classId} Overview
                </h1>
                <p className="mt-1 text-sm text-[#071e22]/75 dark:text-[#f8fbfa]/80">
                  Signed in as{" "}
                  <span className="font-bold capitalize text-[#1d7874] dark:text-[#f4c095]">
                    {user?.role || "student"}
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl border border-[#679289]/30 bg-[#f8fbfa] px-4 py-2.5 dark:bg-[#071e22]">
                  <span className="block text-xs font-semibold text-[#1d7874]">
                    Enrolled Students
                  </span>
                  <span className="text-xl font-extrabold text-[#071e22] dark:text-white">
                    {studentCount}
                  </span>
                </div>
                <div className="rounded-xl border border-[#679289]/30 bg-[#f8fbfa] px-4 py-2.5 dark:bg-[#071e22]">
                  <span className="block text-xs font-semibold text-[#1d7874]">
                    Assignments
                  </span>
                  <span className="text-xl font-extrabold text-[#071e22] dark:text-white">
                    {assignments.length}
                  </span>
                </div>
                <div className="rounded-xl border border-[#679289]/30 bg-[#f8fbfa] px-4 py-2.5 dark:bg-[#071e22]">
                  <span className="block text-xs font-semibold text-[#1d7874]">
                    Announcements
                  </span>
                  <span className="text-xl font-extrabold text-[#071e22] dark:text-white">
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
                className="group flex flex-col justify-between rounded-2xl border border-[#679289]/35 bg-white p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#1d7874] hover:shadow-md dark:bg-[#0d2b30]"
              >
                <div>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d7874]/15 text-[#1d7874] group-hover:bg-[#1d7874] group-hover:text-white transition-colors">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-[#071e22] group-hover:text-[#1d7874] dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-[#071e22]/75 dark:text-[#f8fbfa]/80">
                    {item.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1d7874]">
                  <span>Open Section</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
