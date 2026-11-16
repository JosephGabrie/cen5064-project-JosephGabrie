"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CardImage } from "@/components/ui/class-card";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import ParentDashboard from "@/components/dashboards/ParentDashboard";
import { BookOpen } from "lucide-react";

interface DashboardClassItem {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  roomNumber?: string;
  room_Number?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<DashboardClassItem[]>([]);

  useEffect(() => {
    if (!user || !user.id) return;
    const role = user.role?.toLowerCase();
    if (role === "admin" || role === "parent") return;

    const fetchClasses = async () => {
      try {
        const response = await fetch(
          `http://localhost:6769/${user.id}/dashboard`
        );
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          setClasses(data);
        } else {
          console.error("failed to fetch classes:", data.error);
        }
      } catch (error) {
        console.error("Network error:", error);
      }
    };

    fetchClasses();
  }, [user]);

  if (user?.role?.toLowerCase() === "admin") {
    return <AdminDashboard />;
  }

  if (user?.role?.toLowerCase() === "parent" && user.id) {
    return <ParentDashboard parentId={user.id} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl border border-[#679289]/35 bg-white p-6 shadow-sm dark:bg-[#0d2b30]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4c095]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#071e22]">
              <BookOpen className="h-3.5 w-3.5 text-[#1d7874]" />
              Academic Workspace
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#071e22] dark:text-white">
              My Classes
            </h1>
            <p className="mt-1 text-sm text-[#071e22]/75 dark:text-[#f8fbfa]/80">
              Select a course card below to view assignments, quizzes, grades, and announcements.
            </p>
          </div>
          <div className="rounded-xl border border-[#679289]/30 bg-[#1d7874]/10 px-4 py-2.5 text-right">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#1d7874]">
              Active Courses
            </span>
            <span className="text-2xl font-extrabold text-[#071e22] dark:text-white">
              {classes.length}
            </span>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-[#679289]/35 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-[#071e22]/70">
            No enrolled or assigned classes found for your account yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <CardImage
              key={c.id}
              id={c.id}
              courseName={c.name}
              subject={c.subject}
              teacher={c.teacher}
              roomNumber={c.roomNumber || c.room_Number || ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
