'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  SubmissionData,
  SubmissionFeedbackData,
} from '@/components/assignments/StudentAssignmentView';
import { AttendanceRecordItem } from '@/components/attendance/ClassroomAttendanceManager';

export interface ParentClassItem {
  id: string | number;
  name: string;
  subject: string;
  roomNumber?: string | number;
  room_number?: string | number;
  teacher: string;
}

export interface StudentAttendanceSummaryData {
  student_id?: string;
  total_days: number;
  present_count: number;
  absent_count: number;
  tardy_count: number;
  attendance_rate: number;
  records?: AttendanceRecordItem[];
}

export interface ParentAnnouncementItem {
  id: string | number;
  class_id: string | number;
  class_name?: string;
  title: string;
  content: string;
  date: string;
}

export interface ChildGradeItemData {
  assignment_id: string;
  class_id: string;
  class_name?: string;
  type?: string;
  due_date?: string;
  submitted?: boolean;
  submission_id?: string;
  grade: string;
  date_submitted?: string;
  feedback?: SubmissionFeedbackData;
}

export interface ChildOverviewData {
  student_id: string | number;
  internal_id?: string | number;
  user_id?: string | number;
  first_name: string;
  last_name: string;
  email: string;
  classes: ParentClassItem[];
  grades?: ChildGradeItemData[];
  submissions?: SubmissionData[];
  attendance_summary: StudentAttendanceSummaryData;
  attendance_records?: AttendanceRecordItem[];
  announcements: ParentAnnouncementItem[];
}

export interface ParentOverviewResponse {
  parent_id: string;
  children: ChildOverviewData[];
}

interface ParentDashboardProps {
  parentId: string;
}

export default function ParentDashboard({ parentId }: ParentDashboardProps) {
  const [overview, setOverview] = useState<ParentOverviewResponse | null>(null);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parentId) return;
    setLoading(true);
    fetch(
      `http://localhost:6769/api/parents/${encodeURIComponent(
        parentId
      )}/overview`
    )
      .then((res) => res.json())
      .then((data: ParentOverviewResponse) => {
        if (data && Array.isArray(data.children)) {
          setOverview(data);
        }
      })
      .catch((err) => console.error('Error loading parent overview:', err))
      .finally(() => setLoading(false));
  }, [parentId]);

  if (loading) {
    return (
      <div className="p-8 text-slate-600 dark:text-slate-300">
        Loading Parent Portal Dashboard...
      </div>
    );
  }

  const childrenList = overview?.children || [];
  const activeChild = childrenList[selectedChildIndex] || null;

  if (!activeChild) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Parent Portal Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            No linked student accounts were found for Parent ID {parentId}.
          </p>
        </div>
      </div>
    );
  }

  const {
    classes = [],
    grades = [],
    submissions = [],
    attendance_summary: att,
    attendance_records: attRecordsTop = [],
    announcements = [],
  } = activeChild;

  const childDisplayId = String(activeChild.user_id ?? activeChild.student_id);

  const normalizedGrades: ChildGradeItemData[] =
    grades.length > 0
      ? grades
      : submissions.map((s) => ({
          assignment_id: s.assignment_id,
          class_id: s.class_id,
          submitted: true,
          submission_id: s.id,
          grade: s.grade,
          date_submitted: s.date_submitted,
          feedback: s.feedback,
        }));

  const attendanceRecords: AttendanceRecordItem[] =
    attRecordsTop.length > 0 ? attRecordsTop : att?.records || [];

  const pcts = normalizedGrades
    .map((g) => g.feedback?.percentage)
    .filter((p): p is number => typeof p === 'number');
  const avgGradePct =
    pcts.length > 0
      ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10
      : null;

  const completedCount = normalizedGrades.filter(
    (g) => g.submitted !== false && g.grade !== 'Not Submitted'
  ).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md dark:bg-blue-950 dark:text-blue-300">
            Parent Portal
          </span>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">
            Parent Portal Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Monitoring academic progress, attendance, and class announcements
            for{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {activeChild.first_name} {activeChild.last_name}
            </span>{' '}
            (Student ID: {childDisplayId})
          </p>
        </div>

        {childrenList.length > 1 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="child-selector"
              className="text-xs font-semibold uppercase text-slate-500"
            >
              Linked Child:
            </label>
            <select
              id="child-selector"
              value={selectedChildIndex}
              onChange={(e) => setSelectedChildIndex(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              {childrenList.map((ch, idx) => (
                <option key={String(ch.user_id ?? ch.student_id)} value={idx}>
                  {ch.first_name} {ch.last_name} (ID:{' '}
                  {String(ch.user_id ?? ch.student_id)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Attendance Rate
          </div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">
            {att?.attendance_rate ?? 100}%
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {att?.present_count ?? 0} Present • {att?.tardy_count ?? 0} Tardy •{' '}
            {att?.absent_count ?? 0} Absent
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Average Assignment Score
          </div>
          <div className="text-3xl font-bold text-blue-600 mt-1">
            {avgGradePct !== null ? `${avgGradePct}%` : 'N/A'}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {completedCount} Completed / {normalizedGrades.length} Total
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Enrolled Classes
          </div>
          <div className="text-3xl font-bold text-indigo-600 mt-1">
            {classes.length}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Active academic courses
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="text-xs font-semibold uppercase text-slate-500">
            Class Announcements
          </div>
          <div className="text-3xl font-bold text-amber-600 mt-1">
            {announcements.length}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Recent teacher updates
          </div>
        </div>
      </div>

      {/* Enrolled Classes Quick View */}
      <section className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-3">
          {activeChild.first_name}&apos;s Enrolled Classes
        </h2>
        {classes.length === 0 ? (
          <p className="text-slate-500 italic">No enrolled classes found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={String(cls.id)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded dark:bg-blue-950 dark:text-blue-300">
                    {cls.subject}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Teacher: {cls.teacher} • Room{' '}
                    {cls.roomNumber ?? cls.room_number}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <Link
                    href={`/class/${cls.id}/grades`}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Grades
                  </Link>
                  <span className="text-slate-300">•</span>
                  <Link
                    href={`/class/${cls.id}/assignments`}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Assignments
                  </Link>
                  <span className="text-slate-300">•</span>
                  <Link
                    href={`/class/${cls.id}/attendance`}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Attendance
                  </Link>
                  <span className="text-slate-300">•</span>
                  <Link
                    href={`/class/${cls.id}/announcements`}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Announcements
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linked Child's Grades & Instant Feedback */}
        <section className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-3">
            Grades &amp; Assignment Feedback
          </h2>
          {normalizedGrades.length === 0 ? (
            <p className="text-slate-500 italic">
              No graded assignments submitted yet.
            </p>
          ) : (
            <div className="space-y-4">
              {normalizedGrades.map((item, gIdx) => (
                <div
                  key={item.submission_id || item.assignment_id || gIdx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.class_name || `Class ${item.class_id}`} •{' '}
                        {item.type || 'Assignment'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.date_submitted
                          ? `Submitted: ${new Date(
                              item.date_submitted
                            ).toLocaleString()}`
                          : item.due_date
                          ? `Due: ${new Date(item.due_date).toLocaleString()}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.grade === 'Not Submitted'
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        Grade: {item.grade}
                      </span>
                      {item.feedback && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {item.feedback.earned_points} /{' '}
                          {item.feedback.total_points} pts (
                          {item.feedback.percentage}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {item.feedback && item.feedback.questions.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {item.feedback.questions.map((q, idx) => (
                        <div
                          key={q.question_id || idx}
                          className="text-xs flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700"
                        >
                          <span className="text-slate-700 dark:text-slate-200 truncate mr-2">
                            Q{idx + 1}: {q.question_text}
                          </span>
                          <span
                            className={`font-semibold shrink-0 ${
                              q.is_correct ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {q.awarded_points}/{q.max_points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Linked Child's Attendance Summary & Daily Logs */}
        <section className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-3">
            Attendance Summary &amp; Daily Log
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center dark:bg-emerald-950/30 dark:border-emerald-800">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                Present
              </div>
              <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                {att?.present_count ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center dark:bg-red-950/30 dark:border-red-800">
              <div className="text-xs text-red-700 dark:text-red-300 font-medium">
                Absent
              </div>
              <div className="text-xl font-bold text-red-900 dark:text-red-100">
                {att?.absent_count ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center dark:bg-amber-950/30 dark:border-amber-800">
              <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                Tardy
              </div>
              <div className="text-xl font-bold text-amber-900 dark:text-amber-100">
                {att?.tardy_count ?? 0}
              </div>
            </div>
          </div>

          {attendanceRecords.length === 0 ? (
            <p className="text-slate-500 italic">
              No daily attendance records logged yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {attendanceRecords.map((rec, idx) => (
                <div
                  key={rec.id || `${rec.date}-${idx}`}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {rec.date} • Class {rec.class_id}
                    </div>
                    {rec.notes && (
                      <div className="text-xs text-slate-500">
                        Note: {rec.notes}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      rec.status === 'present'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : rec.status === 'absent'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Class Announcements */}
      <section className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-3">
          Class Announcements
        </h2>
        {announcements.length === 0 ? (
          <p className="text-slate-500 italic">
            No announcements from your child&apos;s classes yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div
                key={String(ann.id)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded dark:bg-indigo-950 dark:text-indigo-300">
                    {ann.class_name || `Class ${ann.class_id}`}
                  </span>
                  <span className="text-xs text-slate-500">{ann.date}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  {ann.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
