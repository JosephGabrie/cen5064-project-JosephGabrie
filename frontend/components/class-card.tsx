import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, MapPin } from "lucide-react";

export interface ClassCardProps {
  title: string;
  subject: string;
  teacher: string;
  room: string;
}

// Map subjects to their respective colors (matching the calendar legend)
const subjectColors: Record<string, { bg: string; text: string; border: string }> = {
  Math: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  Science: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  English: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  History: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
};

export function ClassCard({ title, subject, teacher, room }: ClassCardProps) {
  // Default to a neutral slate color if the subject isn't found in our map
  const colors = subjectColors[subject] || {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
  };

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md border ${colors.border}`}>
      {/* Header section with dynamic subject background */}
      <CardHeader className={`${colors.bg} pb-4`}>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className={`text-lg font-bold leading-tight ${colors.text}`}>
            {title}
          </CardTitle>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/60 dark:bg-black/20 ${colors.text}`}>
            {subject}
          </span>
        </div>
      </CardHeader>
      
      {/* Content section for Teacher and Room */}
      <CardContent className="pt-4">
        <div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
              {teacher}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{room}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
