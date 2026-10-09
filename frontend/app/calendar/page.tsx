"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const legends = [
  { label: "Global Announcement", color: "bg-rose-500" },
  { label: "Class Announcement", color: "bg-sky-500" },
  { label: "Math", color: "bg-purple-500" },
  { label: "Science", color: "bg-emerald-500" },
  { label: "English", color: "bg-blue-500" },
  { label: "History", color: "bg-orange-500" },
];

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface Assignment {
  id: string;
  class_id: string;
  due_date: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetch(`http://localhost:6769/api/users/${user.id}/assignments`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAssignments(data);
        }
      })
      .catch((err) => console.error("Error fetching assignments:", err));
  }, [user]);

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false,
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        month,
        year,
        isCurrentMonth: true,
        isToday:
          i === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear(),
      });
    }

    // Next month days to complete 42 (6 rows)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const calendarDays = getCalendarDays();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full">
      {/* Header section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800">
            {monthName} {year}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                )
              }
              className="p-1 hover:bg-slate-100 rounded-md text-slate-600"
            >
              &lt;
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-sm font-medium hover:bg-slate-100 px-2 py-1 rounded-md text-slate-600"
            >
              Today
            </button>
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                )
              }
              className="p-1 hover:bg-slate-100 rounded-md text-slate-600"
            >
              &gt;
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
          {legends.map((legend, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${legend.color}`}></span>
              {legend.label}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {daysOfWeek.map((day, idx) => (
            <div
              key={day}
              className={`py-3 text-center text-xs font-semibold text-slate-500 ${
                idx !== 6 ? "border-r border-slate-200" : ""
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 flex-1">
          {calendarDays.map((day, idx) => {
            const isLastCol = (idx + 1) % 7 === 0;
            const isLastRow = idx >= 35; // The last 7 days of a 42-day grid

            const dayDateObj = new Date(day.year, day.month, day.date);
            const dayAssignments = assignments.filter((a) => {
              const aDate = new Date(a.due_date);
              return (
                aDate.getFullYear() === dayDateObj.getFullYear() &&
                aDate.getMonth() === dayDateObj.getMonth() &&
                aDate.getDate() === dayDateObj.getDate()
              );
            });

            return (
              <div
                key={idx}
                className={`min-h-[140px] p-2 flex flex-col transition-colors ${
                  !day.isCurrentMonth ? "bg-slate-50/50" : "bg-white"
                } ${!isLastCol ? "border-r border-slate-200" : ""} ${
                  !isLastRow ? "border-b border-slate-200" : ""
                } ${day.isToday ? "ring-2 ring-inset ring-blue-500" : ""}`}
              >
                <div className="flex items-start">
                  {day.isToday ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 font-semibold text-white text-sm">
                      {day.date}
                    </div>
                  ) : (
                    <span
                      className={`font-semibold text-sm p-1 ${
                        !day.isCurrentMonth
                          ? "text-slate-400"
                          : "text-slate-700"
                      }`}
                    >
                      {day.date}
                    </span>
                  )}
                </div>
                {/* Event area */}
                <div className="flex-1 mt-1 space-y-1 overflow-y-auto">
                  {dayAssignments.map((a) => (
                    <div
                      key={a.id}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate bg-blue-500 text-white font-medium"
                      title={`Assignment due: Class ${a.class_id}`}
                    >
                      Class {a.class_id} Due
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
