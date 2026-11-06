"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CardImage } from "@/components/ui/class-card";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import ParentDashboard from "@/components/dashboards/ParentDashboard";

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
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
      {classes?.map((c) => (
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
  );
}
