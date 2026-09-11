import React from "react";

const legends = [
  { label: "Global Announcement", color: "bg-rose-500" },
  { label: "Class Announcement", color: "bg-sky-500" },
  { label: "Math", color: "bg-purple-500" },
  { label: "Science", color: "bg-emerald-500" },
  { label: "English", color: "bg-blue-500" },
  { label: "History", color: "bg-orange-500" },
];

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Generate the 42 days for the calendar grid (Sept 2026)
const calendarDays: Array<{ date: number; isCurrentMonth: boolean; isToday?: boolean }> = [
  { date: 30, isCurrentMonth: false },
  { date: 31, isCurrentMonth: false },
  ...Array.from({ length: 30 }, (_, i) => ({
    date: i + 1,
    isCurrentMonth: true,
    isToday: i + 1 === 5,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    date: i + 1,
    isCurrentMonth: false,
  })),
];

export default function CalendarPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full">
      {/* Header section */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">September 2026</h1>
        
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

            return (
              <div
                key={idx}
                className={`min-h-[140px] p-2 flex flex-col transition-colors ${
                  !day.isCurrentMonth ? "bg-slate-50/50" : "bg-white"
                } ${!isLastCol ? "border-r border-slate-200" : ""} ${
                  !isLastRow ? "border-b border-slate-200" : ""
                } ${
                  day.isToday ? "ring-2 ring-inset ring-blue-500" : ""
                }`}
              >
                <div className="flex items-start">
                  {day.isToday ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 font-semibold text-white text-sm">
                      {day.date}
                    </div>
                  ) : (
                    <span
                      className={`font-semibold text-sm p-1 ${
                        !day.isCurrentMonth ? "text-slate-400" : "text-slate-700"
                      }`}
                    >
                      {day.date}
                    </span>
                  )}
                </div>
                {/* Event area can go here later */}
                <div className="flex-1 mt-1"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
