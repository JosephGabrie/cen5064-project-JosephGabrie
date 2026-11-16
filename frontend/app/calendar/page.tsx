"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const legends = [
  { label: "Assignment Due", color: "bg-[#1d7874]" },
  { label: "Class Announcement", color: "bg-[#679289]" },
  { label: "Special Event", color: "bg-[#f4c095]" },
  { label: "Urgent / Deadline", color: "bg-[#ee2e31]" },
];

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface Assignment {
  id: string;
  class_id: string;
  title?: string;
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

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false,
      });
    }

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
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#679289]/35 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d7874] text-white">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#071e22]">
              {monthName} {year}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                  )
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Next month"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1
                  )
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#071e22]">
          {legends.map((legend, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full border border-[#071e22]/15 ${legend.color}`}
              />
              {legend.label}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-2xl border border-[#679289]/35 bg-white shadow-sm">
        <div className="min-w-[680px]">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-[#679289]/30 bg-[#1d7874] text-white">
            {daysOfWeek.map((day, idx) => (
              <div
                key={day}
                className={`py-3 text-center text-xs font-bold tracking-wider ${
                  idx !== 6 ? "border-r border-[#679289]/25" : ""
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const isLastCol = (idx + 1) % 7 === 0;
              const isLastRow = idx >= 35;

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
                  className={`flex min-h-[128px] flex-col p-2 transition-colors ${
                    !day.isCurrentMonth ? "bg-[#679289]/10" : "bg-white"
                  } ${!isLastCol ? "border-r border-[#679289]/25" : ""} ${
                    !isLastRow ? "border-b border-[#679289]/25" : ""
                  } ${day.isToday ? "ring-2 ring-inset ring-[#1d7874] bg-[#f4c095]/15" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    {day.isToday ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1d7874] text-sm font-bold text-white">
                        {day.date}
                      </div>
                    ) : (
                      <span
                        className={`p-1 text-sm font-semibold ${
                          !day.isCurrentMonth
                            ? "text-[#679289]"
                            : "text-[#071e22]"
                        }`}
                      >
                        {day.date}
                      </span>
                    )}
                  </div>

                  {/* Event area */}
                  <div className="mt-1.5 flex-1 space-y-1.5 overflow-y-auto">
                    {dayAssignments.map((a) => {
                      const label = a.title?.trim()
                        ? `${a.title.trim()} (Class ${a.class_id})`
                        : `Class ${a.class_id} Due`;
                      return (
                        <div
                          key={a.id}
                          className="truncate rounded-md bg-[#1d7874] px-2 py-1 text-[11px] font-semibold text-white shadow-2xs"
                          title={`Assignment due: ${label}`}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
