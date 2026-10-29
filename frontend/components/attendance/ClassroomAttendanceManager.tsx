'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type AttendanceStatusType = 'present' | 'absent' | 'tardy';

export interface ClassStudent {
  student_id: string | number;
  internal_id?: string | number;
  user_id?: string | number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface SeatAssignmentItem {
  id?: string | number;
  class_id?: string | number;
  student_id: string | number;
  student_name?: string;
  row: number;
  col: number;
  first_name?: string;
  last_name?: string;
}

export interface AttendanceRecordItem {
  id?: string;
  class_id: string;
  student_id: string;
  date: string;
  status: AttendanceStatusType;
  notes?: string;
  updated_at?: string;
}

export interface DailyAttendanceLogItem {
  date: string;
  total_students?: number;
  present_count: number;
  absent_count: number;
  tardy_count: number;
  records: AttendanceRecordItem[];
}

interface ClassroomAttendanceManagerProps {
  classId: string;
  userRole: string;
  userId: string;
}

const GRID_ROWS = 4;
const GRID_COLS = 5;

function getCanonicalStudentId(st: ClassStudent): string {
  return String(st.user_id ?? st.student_id);
}

export default function ClassroomAttendanceManager({
  classId,
  userRole,
  userId,
}: ClassroomAttendanceManagerProps) {
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
  const todayStr = new Date().toISOString().slice(0, 10);

  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [seats, setSeats] = useState<SeatAssignmentItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatusType; notes: string }>
  >({});
  const [dailyLogs, setDailyLogs] = useState<DailyAttendanceLogItem[]>([]);
  const [seatingMessage, setSeatingMessage] = useState<string | null>(null);
  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(
    null
  );
  const [savingSeating, setSavingSeating] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const fetchRosterAndSeating = useCallback(async () => {
    try {
      const [studentsRes, seatingRes, logsRes] = await Promise.all([
        fetch(`http://localhost:6769/api/classes/${classId}/students`),
        fetch(`http://localhost:6769/api/classes/${classId}/seating`),
        fetch(`http://localhost:6769/api/classes/${classId}/attendance/logs`),
      ]);

      if (studentsRes.ok) {
        const sData = await studentsRes.json();
        if (Array.isArray(sData)) {
          setStudents(sData);
        }
      }
      if (seatingRes.ok) {
        const seatData = await seatingRes.json();
        if (Array.isArray(seatData)) {
          setSeats(seatData);
        }
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        if (Array.isArray(lData)) {
          setDailyLogs(lData);
        }
      }
    } catch (err) {
      console.error('Error loading classroom roster/seating:', err);
    }
  }, [classId]);

  const fetchAttendanceForDate = useCallback(
    async (dateStr: string, roster: ClassStudent[]) => {
      try {
        const res = await fetch(
          `http://localhost:6769/api/classes/${classId}/attendance?date=${encodeURIComponent(
            dateStr
          )}`
        );
        const defaultMap: Record<
          string,
          { status: AttendanceStatusType; notes: string }
        > = {};
        roster.forEach((st) => {
          defaultMap[getCanonicalStudentId(st)] = {
            status: 'present',
            notes: '',
          };
        });

        if (res.ok) {
          const data: AttendanceRecordItem[] = await res.json();
          if (Array.isArray(data)) {
            data.forEach((rec) => {
              defaultMap[String(rec.student_id)] = {
                status: rec.status || 'present',
                notes: rec.notes || '',
              };
            });
          }
        }
        setAttendanceMap(defaultMap);
      } catch (err) {
        console.error('Error fetching attendance for date:', err);
      }
    },
    [classId]
  );

  useEffect(() => {
    fetchRosterAndSeating();
  }, [fetchRosterAndSeating]);

  useEffect(() => {
    fetchAttendanceForDate(selectedDate, students);
  }, [selectedDate, students, fetchAttendanceForDate]);

  const getStudentById = (studentUserId: number | string) =>
    students.find(
      (s) =>
        getCanonicalStudentId(s) === String(studentUserId) ||
        String(s.student_id) === String(studentUserId)
    );

  const getSeatAt = (row: number, col: number) =>
    seats.find((s) => s.row === row && s.col === col);

  const getStudentSeat = (studentUserId: number | string) =>
    seats.find((s) => String(s.student_id) === String(studentUserId));

  const handleAssignSeat = (row: number, col: number, studentIdStr: string) => {
    setSeatingMessage(null);
    const filtered = seats.filter((s) => !(s.row === row && s.col === col));
    if (!studentIdStr) {
      setSeats(filtered);
      return;
    }
    const withoutStudent = filtered.filter(
      (s) => String(s.student_id) !== studentIdStr
    );
    const st = getStudentById(studentIdStr);
    setSeats([
      ...withoutStudent,
      {
        student_id: studentIdStr,
        student_name: st ? `${st.first_name} ${st.last_name}` : undefined,
        row,
        col,
        first_name: st?.first_name,
        last_name: st?.last_name,
      },
    ]);
  };

  const handleAutoArrange = () => {
    setSeatingMessage(null);
    const arranged: SeatAssignmentItem[] = students
      .slice(0, GRID_ROWS * GRID_COLS)
      .map((st, idx) => ({
        student_id: getCanonicalStudentId(st),
        student_name: `${st.first_name} ${st.last_name}`,
        row: Math.floor(idx / GRID_COLS),
        col: idx % GRID_COLS,
        first_name: st.first_name,
        last_name: st.last_name,
      }));
    setSeats(arranged);
  };

  const handleSaveSeating = async () => {
    setSavingSeating(true);
    setSeatingMessage(null);
    try {
      const payload = {
        max_rows: GRID_ROWS,
        max_cols: GRID_COLS,
        seats: seats.map((s) => ({
          student_id: String(s.student_id),
          row: s.row,
          col: s.col,
        })),
      };
      const res = await fetch(
        `http://localhost:6769/api/classes/${classId}/seating`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        setSeatingMessage('Seating arrangement saved successfully!');
      } else {
        setSeatingMessage('Failed to save seating arrangement.');
      }
    } catch {
      setSeatingMessage('Network error while saving seating arrangement.');
    } finally {
      setSavingSeating(false);
    }
  };

  const handleStatusChange = (
    studentUserId: string,
    status: AttendanceStatusType
  ) => {
    setAttendanceMessage(null);
    setAttendanceMap((prev) => ({
      ...prev,
      [studentUserId]: {
        status,
        notes: prev[studentUserId]?.notes || '',
      },
    }));
  };

  const handleNotesChange = (studentUserId: string, notes: string) => {
    setAttendanceMessage(null);
    setAttendanceMap((prev) => ({
      ...prev,
      [studentUserId]: {
        status: prev[studentUserId]?.status || 'present',
        notes,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatusType) => {
    setAttendanceMessage(null);
    const updated: Record<
      string,
      { status: AttendanceStatusType; notes: string }
    > = {};
    students.forEach((st) => {
      const id = getCanonicalStudentId(st);
      updated[id] = {
        status,
        notes: attendanceMap[id]?.notes || '',
      };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    setAttendanceMessage(null);
    try {
      const records = students.map((st) => {
        const id = getCanonicalStudentId(st);
        const entry = attendanceMap[id] || { status: 'present', notes: '' };
        return {
          student_id: id,
          status: entry.status,
          notes: entry.notes,
        };
      });

      const res = await fetch(
        `http://localhost:6769/api/classes/${classId}/attendance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            records,
          }),
        }
      );

      if (res.ok) {
        setAttendanceMessage(
          `Attendance saved successfully for ${selectedDate}!`
        );
        const logsRes = await fetch(
          `http://localhost:6769/api/classes/${classId}/attendance/logs`
        );
        if (logsRes.ok) {
          const lData = await logsRes.json();
          if (Array.isArray(lData)) {
            setDailyLogs(lData);
          }
        }
      } else {
        setAttendanceMessage('Failed to save attendance.');
      }
    } catch {
      setAttendanceMessage('Network error while saving attendance.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const presentCount = students.filter(
    (s) =>
      (attendanceMap[getCanonicalStudentId(s)]?.status || 'present') ===
      'present'
  ).length;
  const absentCount = students.filter(
    (s) => attendanceMap[getCanonicalStudentId(s)]?.status === 'absent'
  ).length;
  const tardyCount = students.filter(
    (s) => attendanceMap[getCanonicalStudentId(s)]?.status === 'tardy'
  ).length;

  const statusBadgeColor = (status: AttendanceStatusType) => {
    if (status === 'present') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
    }
    if (status === 'absent') {
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300';
    }
    return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
  };

  return (
    <div className="space-y-10">
      {/* Section 1: Classroom Seating Arrangement */}
      <section className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Classroom Seating Arrangement
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isTeacherOrAdmin
                ? 'Assign students to classroom desks (4 rows × 5 columns) and view live attendance status at each desk.'
                : 'View your assigned classroom seat and layout.'}
            </p>
          </div>
          {isTeacherOrAdmin && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleAutoArrange}>
                Auto-Assign Roster
              </Button>
              <Button
                size="sm"
                disabled={savingSeating}
                onClick={handleSaveSeating}
              >
                {savingSeating ? 'Saving...' : 'Save Seating Arrangement'}
              </Button>
            </div>
          )}
        </div>

        {seatingMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
            {seatingMessage}
          </div>
        )}

        {/* Front of Classroom Banner */}
        <div className="w-full py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Front of Classroom • Whiteboard &amp; Teacher Podium
        </div>

        {/* 4x5 Seating Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: GRID_ROWS }).map((_, rIdx) =>
            Array.from({ length: GRID_COLS }).map((__, cIdx) => {
              const seat = getSeatAt(rIdx, cIdx);
              const assignedStudent = seat
                ? getStudentById(seat.student_id)
                : undefined;
              const studentName = assignedStudent
                ? `${assignedStudent.first_name} ${assignedStudent.last_name}`
                : seat?.student_name
                ? seat.student_name
                : seat?.first_name
                ? `${seat.first_name} ${seat.last_name || ''}`
                : null;
              const stStatus = seat
                ? attendanceMap[String(seat.student_id)]?.status || 'present'
                : null;
              const isCurrentUserSeat =
                seat && String(seat.student_id) === String(userId);

              return (
                <div
                  key={`desk-${rIdx}-${cIdx}`}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[115px] ${
                    isCurrentUserSeat
                      ? 'border-blue-500 ring-2 ring-blue-300 bg-blue-50/50 dark:bg-blue-950/30'
                      : seat
                      ? 'border-slate-300 bg-slate-50 dark:bg-slate-900 dark:border-slate-700'
                      : 'border-dashed border-slate-200 bg-white dark:bg-slate-800/40 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>
                      R{rIdx + 1} • S{cIdx + 1}
                    </span>
                    {seat && stStatus && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${statusBadgeColor(
                          stStatus
                        )}`}
                      >
                        {stStatus}
                      </span>
                    )}
                  </div>

                  <div className="my-2">
                    {studentName ? (
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                        {studentName}
                      </div>
                    ) : (
                      <div className="text-xs italic text-slate-400">
                        Empty Desk
                      </div>
                    )}
                  </div>

                  {isTeacherOrAdmin && (
                    <select
                      aria-label={`Assign desk row ${rIdx + 1} seat ${cIdx + 1}`}
                      value={seat ? String(seat.student_id) : ''}
                      onChange={(e) =>
                        handleAssignSeat(rIdx, cIdx, e.target.value)
                      }
                      className="w-full text-xs rounded border border-slate-200 bg-white px-1.5 py-1 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    >
                      <option value="">-- Unassigned --</option>
                      {students.map((st) => {
                        const cid = getCanonicalStudentId(st);
                        return (
                          <option key={cid} value={cid}>
                            {st.first_name} {st.last_name}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Section 2: Daily Attendance Roster */}
      <section className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Daily Attendance Roster
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mark students as Present, Absent, or Tardy and record daily notes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="attendance-date-picker"
                className="text-xs font-semibold uppercase text-slate-500"
              >
                Date:
              </label>
              <Input
                id="attendance-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            {isTeacherOrAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll('present')}
                >
                  Mark All Present
                </Button>
                <Button
                  size="sm"
                  disabled={savingAttendance}
                  onClick={handleSaveAttendance}
                >
                  {savingAttendance ? 'Saving...' : 'Save Attendance'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Summary Counters */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Present
            </div>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {presentCount}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
            <div className="text-xs font-medium text-red-700 dark:text-red-300">
              Absent
            </div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {absentCount}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
            <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Tardy
            </div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              {tardyCount}
            </div>
          </div>
        </div>

        {attendanceMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
            {attendanceMessage}
          </div>
        )}

        {students.length === 0 ? (
          <p className="text-slate-500 italic">
            No students enrolled in this class yet.
          </p>
        ) : (
          <div className="space-y-3">
            {students
              .filter(
                (st) =>
                  isTeacherOrAdmin ||
                  getCanonicalStudentId(st) === String(userId)
              )
              .map((st) => {
                const sId = getCanonicalStudentId(st);
                const current = attendanceMap[sId] || {
                  status: 'present',
                  notes: '',
                };
                const seat = getStudentSeat(sId);

                return (
                  <div
                    key={sId}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-slate-900 dark:border-slate-700"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {st.first_name} {st.last_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        ID: {sId}
                        {seat
                          ? ` • Seat: Row ${seat.row + 1}, Col ${seat.col + 1}`
                          : ' • Unassigned Seat'}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(['present', 'absent', 'tardy'] as const).map(
                        (statusOpt) => {
                          const isSelected = current.status === statusOpt;
                          const label =
                            statusOpt.charAt(0).toUpperCase() +
                            statusOpt.slice(1);
                          return (
                            <Button
                              key={statusOpt}
                              type="button"
                              size="sm"
                              disabled={!isTeacherOrAdmin}
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(sId, statusOpt)}
                              className={
                                isSelected
                                  ? statusOpt === 'present'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : statusOpt === 'absent'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                                  : ''
                              }
                            >
                              {label}
                            </Button>
                          );
                        }
                      )}
                      <Input
                        placeholder="Attendance note (optional)"
                        disabled={!isTeacherOrAdmin}
                        value={current.notes}
                        onChange={(e) => handleNotesChange(sId, e.target.value)}
                        className="w-52 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Section 3: Daily Attendance Logs */}
      <section className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Daily Attendance Logs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Historical daily attendance logs and status breakdown for Class{' '}
            {classId}.
          </p>
        </div>

        {dailyLogs.length === 0 ? (
          <p className="text-slate-500 italic">
            No attendance logs recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {dailyLogs.map((log) => (
              <div
                key={log.date}
                className="p-4 border border-slate-200 rounded-xl bg-slate-50 dark:bg-slate-900 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    Date: {log.date}
                  </div>
                  <div className="text-xs text-slate-500">
                    Total Recorded:{' '}
                    {log.total_students ?? (log.records?.length || 0)}{' '}
                    student(s)
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Present: {log.present_count}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                    Absent: {log.absent_count}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Tardy: {log.tardy_count}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(log.date)}
                  >
                    Load Date
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
